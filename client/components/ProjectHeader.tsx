"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import axios from "axios"
import { ArrowLeft, Sparkles, Mail, Send } from "lucide-react"
import { inviteMember } from "../services/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface Project {
  id: number
  name: string
}

interface ProjectHeaderProps {
  project: Project | null
  onOpenAiModal: () => void
}

export default function ProjectHeader({ project, onOpenAiModal }: ProjectHeaderProps) {
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [isInviting, setIsInviting] = useState(false)

  const handleInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!project) return

    setIsInviting(true)
    setInviteMessage("")
    try {
      const response = await inviteMember(project.id, inviteEmail)
      setInviteMessage(response.data.msg)
      setInviteEmail("")
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setInviteMessage(error.response?.data.msg || "Invitation failed.")
      } else {
        setInviteMessage("An unexpected error occurred.")
      }
    } finally {
      setIsInviting(false)
    }
  }

  return (
    <header className="mb-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{project ? project.name : "Project Workspace"}</h1>
            <p className="text-muted-foreground mt-1">Manage your project tasks and collaborate with your team</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <Button
            onClick={onOpenAiModal}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Generate with AI
          </Button>

          <Card className="bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Invite user by email"
                    className="pl-10 bg-background/50"
                    required
                  />
                </div>
                <Button type="submit" disabled={isInviting} size="sm" className="whitespace-nowrap">
                  {isInviting ? (
                    <>
                      <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Invite
                    </>
                  )}
                </Button>
              </form>
              {inviteMessage && (
                <div className="mt-3">
                  <Badge
                    variant={
                      inviteMessage.includes("failed") || inviteMessage.includes("error") ? "destructive" : "default"
                    }
                    className="text-xs"
                  >
                    {inviteMessage}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </header>
  )
}
