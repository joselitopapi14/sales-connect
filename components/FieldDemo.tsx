"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/authContexts"
import { useUsers } from "@/contexts/UsersContext"
import { toast } from "sonner"

export function FieldDemo() {
  const { signUp } = useAuth()
  const { refreshUsers } = useUsers()
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    cedula: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      console.log("Registering user with auth:", {
        email: formData.email,
        name: formData.name,
      });
      
      // Registrar usuario con Supabase Auth
      const { error } = await signUp(
        formData.email,
        formData.password,
        {
          name: formData.name,
          phone: formData.phone,
          cedula: formData.cedula,
        }
      )

      if (error) {
        throw new Error(error.message)
      }

      // Refrescar la lista de usuarios
      await refreshUsers()

      // Reset form only on success
      setFormData({
        name: "",
        email: "",
        phone: "",
        cedula: "",
        password: "",
      })
      
      toast.success("User registered successfully!", {
        description: `${formData.name} has been registered and added to the system.`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to register user";
      console.error("Failed to register user:", {
        error,
        message: errorMessage,
        type: typeof error,
      });
      
      toast.error("Failed to register user", {
        description: errorMessage,
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClear = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      cedula: "",
      password: "",
    })
  }

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>New User</FieldLegend>
            <FieldDescription>
              Add a new user record to the system
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="user-name">
                  Full Name
                </FieldLabel>
                <Input
                  id="user-name"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <FieldDescription>
                  Full name of the user
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="user-email">
                  Email Address
                </FieldLabel>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="john.doe@example.com"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <FieldDescription>
                  User&apos;s email address
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="user-phone">
                  Phone Number
                </FieldLabel>
                <Input
                  id="user-phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
                <FieldDescription>
                  User&apos;s phone number
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="user-cedula">
                  Cédula
                </FieldLabel>
                <Input
                  id="user-cedula"
                  placeholder="1234567890"
                  required
                  value={formData.cedula}
                  onChange={(e) =>
                    setFormData({ ...formData, cedula: e.target.value })
                  }
                />
                <FieldDescription>
                  User&apos;s identification number
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="user-password">
                  Password
                </FieldLabel>
                <Input
                  id="user-password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <FieldDescription>
                  Password must be at least 6 characters
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldSet>
          <Field orientation="horizontal">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Registering..." : "Register User"}
            </Button>
            <Button variant="outline" type="button" onClick={handleClear} disabled={isSubmitting}>
              Clear
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
