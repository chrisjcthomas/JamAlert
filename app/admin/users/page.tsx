"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Mail,
  Phone,
  MapPin,
  AlertCircle
} from "lucide-react"
import { PARISH_NAMES, Parish } from "@/lib/types"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  parish: Parish
  isActive: boolean
  emailAlerts: boolean
  smsAlerts: boolean
  emergencyOnly: boolean
  createdAt: string
  lastLogin?: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [parishFilter, setParishFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, parishFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      // Mock data for now - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockUsers: User[] = [
        {
          id: "1",
          firstName: "John",
          lastName: "Smith",
          email: "john.smith@email.com",
          phone: "+1876-555-0123",
          parish: Parish.ST_CATHERINE,
          isActive: true,
          emailAlerts: true,
          smsAlerts: false,
          emergencyOnly: false,
          createdAt: "2024-01-15T10:30:00Z",
          lastLogin: "2024-01-20T14:22:00Z"
        },
        {
          id: "2",
          firstName: "Maria",
          lastName: "Johnson",
          email: "maria.j@gmail.com",
          phone: "+1876-555-0456",
          parish: Parish.KINGSTON,
          isActive: true,
          emailAlerts: true,
          smsAlerts: true,
          emergencyOnly: true,
          createdAt: "2024-01-10T09:15:00Z",
          lastLogin: "2024-01-19T16:45:00Z"
        },
        {
          id: "3",
          firstName: "Robert",
          lastName: "Brown",
          email: "r.brown@yahoo.com",
          parish: Parish.ST_ANDREW,
          isActive: false,
          emailAlerts: true,
          smsAlerts: false,
          emergencyOnly: false,
          createdAt: "2024-01-05T11:20:00Z"
        },
        {
          id: "4",
          firstName: "Grace",
          lastName: "Williams",
          email: "grace.w@hotmail.com",
          phone: "+1876-555-0789",
          parish: Parish.MANCHESTER,
          isActive: true,
          emailAlerts: true,
          smsAlerts: true,
          emergencyOnly: false,
          createdAt: "2024-01-12T13:45:00Z",
          lastLogin: "2024-01-21T08:30:00Z"
        }
      ]
      
      setUsers(mockUsers)
    } catch (err) {
      setError("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Parish filter
    if (parishFilter !== "all") {
      filtered = filtered.filter(user => user.parish === parishFilter)
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => 
        statusFilter === "active" ? user.isActive : !user.isActive
      )
    }

    setFilteredUsers(filtered)
  }

  const handleUserAction = async (userId: string, action: "activate" | "deactivate") => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, isActive: action === "activate" }
          : user
      ))
    } catch (err) {
      setError(`Failed to ${action} user`)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage registered users and their alert preferences
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Search and filter users by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Parish</Label>
              <Select value={parishFilter} onValueChange={setParishFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All parishes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Parishes</SelectItem>
                  {Object.entries(PARISH_NAMES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("")
                  setParishFilter("all")
                  setStatusFilter("all")
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            Registered users and their account details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Parish</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ID: {user.id}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="mr-1 h-3 w-3" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="mr-1 h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-3 w-3" />
                      {PARISH_NAMES[user.parish]}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.emailAlerts && (
                        <Badge variant="secondary" className="text-xs">
                          Email
                        </Badge>
                      )}
                      {user.smsAlerts && (
                        <Badge variant="secondary" className="text-xs">
                          SMS
                        </Badge>
                      )}
                      {user.emergencyOnly && (
                        <Badge variant="outline" className="text-xs">
                          Emergency Only
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(user.createdAt)}
                    </div>
                    {user.lastLogin && (
                      <div className="text-xs text-muted-foreground">
                        Last: {formatDate(user.lastLogin)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.isActive ? (
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user.id, "deactivate")}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user.id, "activate")}
                          >
                            <UserCheck className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}