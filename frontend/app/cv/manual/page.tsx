"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient, ApiError } from "@/lib/api"

interface Experience {
  title: string
  company: string
  startDate: string
  endDate?: string
  description: string
  current?: boolean
}

interface Education {
  degree: string
  school: string
  startDate: string
  endDate?: string
  description?: string
}

interface Project {
  name: string
  description: string
  technologies?: string[]
  link?: string
}

export default function ManualCVPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [summary, setSummary] = useState("")
  const [skills, setSkills] = useState("")
  const [passions, setPassions] = useState("")

  const [experiences, setExperiences] = useState<Experience[]>([
    { title: "", company: "", startDate: "", endDate: "", description: "", current: false }
  ])

  const [education, setEducation] = useState<Education[]>([
    { degree: "", school: "", startDate: "", endDate: "", description: "" }
  ])

  const [projects, setProjects] = useState<Project[]>([
    { name: "", description: "", technologies: [], link: "" }
  ])

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const cvData = {
        name,
        email,
        phone,
        summary,
        skills: skills.split(",").map(s => s.trim()).filter(Boolean),
        passions: passions.split(",").map(p => p.trim()).filter(Boolean),
        experiences: experiences.filter(exp => exp.title && exp.company),
        education: education.filter(edu => edu.degree && edu.school),
        projects: projects.filter(proj => proj.name)
      }

      const response = await apiClient.saveManualCV(cvData)
      setSuccess(response.message || "CV saved successfully!")
      
      // Si c'est l'onboarding, rediriger vers l'étape 2
      if (isOnboarding) {
        setTimeout(() => {
          router.push('/onboarding')
        }, 1500)
      }
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.error || "An error occurred while saving CV")
    } finally {
      setIsLoading(false)
    }
  }

  const addExperience = () => {
    setExperiences([...experiences, { title: "", company: "", startDate: "", endDate: "", description: "", current: false }])
  }

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index))
  }

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const updated = [...experiences]
    updated[index] = { ...updated[index], [field]: value }
    setExperiences(updated)
  }

  const addEducation = () => {
    setEducation([...education, { degree: "", school: "", startDate: "", endDate: "", description: "" }])
  }

  const removeEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index))
  }

  const updateEducation = (index: number, field: keyof Education, value: string) => {
    const updated = [...education]
    updated[index] = { ...updated[index], [field]: value }
    setEducation(updated)
  }

  const addProject = () => {
    setProjects([...projects, { name: "", description: "", technologies: [], link: "" }])
  }

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index))
  }

  const updateProject = (index: number, field: keyof Project, value: any) => {
    const updated = [...projects]
    updated[index] = { ...updated[index], [field]: value }
    setProjects(updated)
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-between items-start border-b border-black pb-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-black">
              {isOnboarding ? "Configuration - Votre CV" : "Create Your CV"}
            </h1>
            <p className="text-sm text-gray-600">
              {isOnboarding ? "Étape 1 : Remplissez les informations de votre CV" : "Fill in your professional information manually"}
            </p>
          </div>
          {!isOnboarding && (
            <Link href="/dashboard">
              <Button type="button" className="bg-gray-600 hover:bg-gray-700">
                View Dashboard
              </Button>
            </Link>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded flex justify-between items-center">
              <span>{success}</span>
              <Link href="/dashboard">
                <Button type="button" size="sm">
                  View Dashboard
                </Button>
              </Link>
            </div>
          )}

          {/* Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-black">Personal Information</h2>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Professional Summary</Label>
              <textarea
                id="summary"
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md text-black placeholder:text-gray-400"
                placeholder="Brief professional summary..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-black">Skills</h2>
            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma separated)</Label>
              <Input
                id="skills"
                type="text"
                placeholder="JavaScript, React, Node.js, Python"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Passions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-black">Passions</h2>
            <div className="space-y-2">
              <Label htmlFor="passions">Passions (comma separated)</Label>
              <Input
                id="passions"
                type="text"
                placeholder="Open Source, AI, Music"
                value={passions}
                onChange={(e) => setPassions(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Experiences */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">Work Experience</h2>
              <Button type="button" onClick={addExperience} disabled={isLoading}>
                Add Experience
              </Button>
            </div>

            {experiences.map((exp, index) => (
              <div key={index} className="p-4 border border-gray-300 rounded-md space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-black">Experience {index + 1}</h3>
                  {experiences.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeExperience(index)}
                      disabled={isLoading}
                      className="text-sm"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Job Title"
                    value={exp.title}
                    onChange={(e) => updateExperience(index, "title", e.target.value)}
                    disabled={isLoading}
                  />
                  <Input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    disabled={isLoading}
                  />
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                    disabled={isLoading}
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={exp.endDate || ""}
                    onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                    disabled={isLoading || exp.current}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`current-${index}`}
                    checked={exp.current || false}
                    onChange={(e) => updateExperience(index, "current", e.target.checked)}
                    disabled={isLoading}
                  />
                  <label htmlFor={`current-${index}`} className="text-sm">
                    Currently working here
                  </label>
                </div>

                <textarea
                  className="w-full min-h-[80px] px-3 py-2 border border-gray-300 rounded-md text-black placeholder:text-gray-400"
                  placeholder="Job description..."
                  value={exp.description}
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">Education</h2>
              <Button type="button" onClick={addEducation} disabled={isLoading}>
                Add Education
              </Button>
            </div>

            {education.map((edu, index) => (
              <div key={index} className="p-4 border border-gray-300 rounded-md space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-black">Education {index + 1}</h3>
                  {education.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeEducation(index)}
                      disabled={isLoading}
                      className="text-sm"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    disabled={isLoading}
                  />
                  <Input
                    placeholder="School/University"
                    value={edu.school}
                    onChange={(e) => updateEducation(index, "school", e.target.value)}
                    disabled={isLoading}
                  />
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={edu.startDate}
                    onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                    disabled={isLoading}
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={edu.endDate || ""}
                    onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <textarea
                  className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md text-black placeholder:text-gray-400"
                  placeholder="Additional details..."
                  value={edu.description || ""}
                  onChange={(e) => updateEducation(index, "description", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>

          {/* Projects */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">Projects</h2>
              <Button type="button" onClick={addProject} disabled={isLoading}>
                Add Project
              </Button>
            </div>

            {projects.map((proj, index) => (
              <div key={index} className="p-4 border border-gray-300 rounded-md space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium text-black">Project {index + 1}</h3>
                  {projects.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeProject(index)}
                      disabled={isLoading}
                      className="text-sm"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <Input
                  placeholder="Project Name"
                  value={proj.name}
                  onChange={(e) => updateProject(index, "name", e.target.value)}
                  disabled={isLoading}
                />

                <textarea
                  className="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-md text-black placeholder:text-gray-400"
                  placeholder="Project description..."
                  value={proj.description}
                  onChange={(e) => updateProject(index, "description", e.target.value)}
                  disabled={isLoading}
                />

                <Input
                  placeholder="Technologies (comma separated)"
                  value={proj.technologies?.join(", ") || ""}
                  onChange={(e) => updateProject(index, "technologies", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
                  disabled={isLoading}
                />

                <Input
                  placeholder="Project Link (optional)"
                  value={proj.link || ""}
                  onChange={(e) => updateProject(index, "link", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving CV..." : "Save CV"}
          </Button>
        </form>
      </div>
    </div>
  )
}
