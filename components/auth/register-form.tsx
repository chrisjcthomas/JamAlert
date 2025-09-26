"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { authService } from "@/lib/api/auth"
import { getErrorMessage, getValidationErrors } from "@/lib/api-client"
import { formDataToApiRequest, PARISH_NAMES, Parish } from "@/lib/types"
import type { RegistrationFormData } from "@/lib/types"

// Get parish display names from the types
const parishes = Object.values(PARISH_NAMES)

export function RegisterForm() {
    const [formData, setFormData] = useState<RegistrationFormData>(() => ({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        parish: "",
        address: "",
        smsAlerts: false,
        emailAlerts: true, // Default to email alerts
        emergencyOnly: false,
        terms: false,
    }))

    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState("")
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
    const [successMessage, setSuccessMessage] = useState("")
    const router = useRouter()

    const handleInputChange = (field: keyof RegistrationFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear field-specific error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[field]
                return newErrors
            })
        }
        // Clear general error when user makes changes
        if (error) {
            setError("")
        }
    }

    const validateForm = (): string | null => {
        if (!formData.firstName.trim()) return "First name is required"
        if (!formData.lastName.trim()) return "Last name is required"
        if (!formData.email.trim()) return "Email is required"
        if (!formData.parish) return "Parish is required"
        if (!formData.terms) return "You must agree to the terms"
        if (!formData.smsAlerts && !formData.emailAlerts) return "Please select at least one alert method"

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) return "Please enter a valid email address"

        // Phone validation (if provided)
        if (formData.phone.trim() && !/^\+?[\d\s\-\(\)]{10,20}$/.test(formData.phone.trim())) {
            return "Please enter a valid phone number"
        }

        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setFieldErrors({})

        const validationError = validateForm()
        if (validationError) {
            setError(validationError)
            return
        }

        setIsLoading(true)

        try {
            // Convert form data to API request format
            const apiRequest = formDataToApiRequest(formData)
            
            // Call the registration API
            const response = await authService.register(apiRequest)
            
            // Set success state with response message
            setSuccess(true)
            setSuccessMessage(
                `Registration successful! You will now receive alerts for ${formData.parish}. ` +
                `Please check your email (${formData.email}) for confirmation.`
            )

            // Redirect after success
            setTimeout(() => {
                router.push("/my-alerts")
            }, 3000)

        } catch (err) {
            console.error("Registration error:", err)
            
            // Handle different types of errors
            const errorMessage = getErrorMessage(err)
            const validationErrors = getValidationErrors(err)
            
            if (Object.keys(validationErrors).length > 0) {
                setFieldErrors(validationErrors)
                setError("Please correct the errors below.")
            } else {
                setError(errorMessage)
            }
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                    {successMessage}
                    <br />
                    <span className="text-sm text-green-600 dark:text-green-400 mt-2 block">
                        Redirecting to your alerts dashboard...
                    </span>
                </AlertDescription>
            </Alert>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <Alert className="border-destructive/50 text-destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Name Fields */}
            <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-foreground">
                        First Name *
                    </Label>
                    <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        placeholder="Enter your first name"
                        className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                            fieldErrors.firstName ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        required
                    />
                    {fieldErrors.firstName && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {fieldErrors.firstName}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-foreground">
                        Last Name *
                    </Label>
                    <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        placeholder="Enter your last name"
                        className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                            fieldErrors.lastName ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        required
                    />
                    {fieldErrors.lastName && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {fieldErrors.lastName}
                        </p>
                    )}
                </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                    Email Address *
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.email@example.com"
                    className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                        fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                    required
                />
                {fieldErrors.email && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.email}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground">
                    Phone Number (Optional)
                </Label>
                <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 (876) 123-4567"
                    className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                        fieldErrors.phone ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                />
                {fieldErrors.phone && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.phone}
                    </p>
                )}
            </div>

            {/* Location */}
            <div className="space-y-2">
                <Label htmlFor="parish" className="text-foreground">
                    Parish *
                </Label>
                <Select value={formData.parish} onValueChange={(value) => handleInputChange("parish", value)}>
                    <SelectTrigger className={`bg-background border-border text-foreground ${
                        fieldErrors.parish ? 'border-red-500 focus:border-red-500' : ''
                    }`}>
                        <SelectValue placeholder="Select your parish" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                        {parishes.map((parish) => (
                            <SelectItem
                                key={parish}
                                value={parish}
                                className="text-foreground hover:bg-muted"
                            >
                                {parish}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {fieldErrors.parish && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.parish}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="address" className="text-foreground">
                    Address (Optional)
                </Label>
                <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter your address for more precise alerts"
                    className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${
                        fieldErrors.address ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                />
                {fieldErrors.address && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {fieldErrors.address}
                    </p>
                )}
            </div>

            {/* Alert Preferences */}
            <div className="space-y-4">
                <Label className="text-foreground font-medium">Alert Preferences *</Label>
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="sms"
                            checked={formData.smsAlerts}
                            onCheckedChange={(checked) => handleInputChange("smsAlerts", !!checked)}
                            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor="sms" className="text-sm text-foreground">
                            SMS Alerts
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="emailAlerts"
                            checked={formData.emailAlerts}
                            onCheckedChange={(checked) => handleInputChange("emailAlerts", !!checked)}
                            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor="emailAlerts" className="text-sm text-foreground">
                            Email Alerts
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="emergency"
                            checked={formData.emergencyOnly}
                            onCheckedChange={(checked) => handleInputChange("emergencyOnly", !!checked)}
                            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <Label htmlFor="emergency" className="text-sm text-foreground">
                            Emergency Alerts Only
                        </Label>
                    </div>
                </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
                <Checkbox
                    id="terms"
                    checked={formData.terms}
                    onCheckedChange={(checked) => handleInputChange("terms", !!checked)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary mt-1"
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                    I agree to receive safety alerts and understand that JamAlert will use my information to provide
                    location-relevant emergency notifications. I can unsubscribe at any time. *
                </Label>
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                    </>
                ) : (
                    "Register for Alerts"
                )}
            </Button>
        </form>
    )
}