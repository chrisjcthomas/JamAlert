import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { UserRegistrationRequest, ApiResponse, Parish } from '../types';
import { UserService } from '../services/user.service';
import { EmailService } from '../services/email.service';
import { ValidationService } from '../services/validation.service';

// Input validation schema
const registrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  phone: z.string().optional().refine(
    (val) => !val || /^\+?[\d\s\-\(\)]{10,20}$/.test(val),
    'Invalid phone number format'
  ),
  parish: z.nativeEnum(Parish, { errorMap: () => ({ message: 'Invalid parish selected' }) }),
  address: z.string().optional().max(1000, 'Address too long'),
  smsAlerts: z.boolean().default(false),
  emailAlerts: z.boolean().default(true),
  emergencyOnly: z.boolean().default(false),
  accessibilitySettings: z.object({
    highContrast: z.boolean().default(false),
    largeFont: z.boolean().default(false),
    textToSpeech: z.boolean().default(false),
  }).optional(),
});

/**
 * User Registration Azure Function
 * POST /api/auth/register
 */
export async function registerUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('User registration request received');

  try {
    // Parse and validate request body
    const body = await request.json() as UserRegistrationRequest;
    const validatedData = registrationSchema.parse(body);

    // Initialize services
    const userService = new UserService();
    const emailService = new EmailService();
    const validationService = new ValidationService();

    // Check if user already exists
    const existingUser = await userService.findByEmail(validatedData.email);
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'User with this email already exists',
      };
      return {
        status: 400,
        jsonBody: response,
      };
    }

    // Validate and sanitize phone number if provided
    if (validatedData.phone) {
      validatedData.phone = validationService.sanitizePhoneNumber(validatedData.phone);
    }

    // Create user account
    const newUser = await userService.create(validatedData);
    context.log(`User created successfully: ${newUser.id}`);

    // Send confirmation email
    try {
      await emailService.sendRegistrationConfirmation(newUser);
      context.log(`Confirmation email sent to: ${newUser.email}`);
    } catch (emailError) {
      context.log.error('Failed to send confirmation email:', emailError);
      // Don't fail registration if email fails - log and continue
    }

    // Return success response (exclude sensitive data)
    const response: ApiResponse = {
      success: true,
      data: {
        userId: newUser.id,
        email: newUser.email,
        parish: newUser.parish,
      },
      message: 'Registration successful. Please check your email for confirmation.',
    };

    return {
      status: 201,
      jsonBody: response,
    };

  } catch (error) {
    context.log.error('Registration error:', error);

    if (error instanceof z.ZodError) {
      // Validation error
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        data: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
      return {
        status: 400,
        jsonBody: response,
      };
    }

    // Generic error response
    const response: ApiResponse = {
      success: false,
      error: 'Registration failed. Please try again.',
    };

    return {
      status: 500,
      jsonBody: response,
    };
  }
}

// Register the function
app.http('auth-register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: registerUser,
});