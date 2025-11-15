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
  const [hasExistingCV, setHasExistingCV] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOnboarding = searchParams.get('onboarding') === 'true'

  // Charger les données existantes du CV au montage
  useEffect(() => {
    const loadExistingCV = async () => {
      try {
        const cvData = await apiClient.getMyCV()
        if (cvData.data) {
          setHasExistingCV(true)
          // Remplir les champs avec les données existantes
          setName(cvData.data.name || "")
          setEmail(cvData.data.email || "")
          setPhone(cvData.data.phone || "")
          setSummary(cvData.data.summary || "")
          setSkills(cvData.data.skills?.join(", ") || "")
          setPassions(cvData.data.passions?.join(", ") || "")

          if (cvData.data.experiences && cvData.data.experiences.length > 0) {
            setExperiences(cvData.data.experiences)
          }

          if (cvData.data.education && cvData.data.education.length > 0) {
            setEducation(cvData.data.education)
          }

          if (cvData.data.projects && cvData.data.projects.length > 0) {
            setProjects(cvData.data.projects)
          }
        }
      } catch (err) {
        // Pas de CV existant, on continue avec un formulaire vide
        console.log("No existing CV found, starting fresh")
      }
    }

    if (!isOnboarding) {
      loadExistingCV()
    }
  }, [isOnboarding])

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

      // Utiliser PUT /data si un CV existe déjà, sinon POST /manual
      const response = hasExistingCV
        ? await apiClient.updateCVData(cvData)
        : await apiClient.saveManualCV(cvData)

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
    <div className="min-h-screen bg-white p-8 relative" style={{ backgroundImage: 'linear-gradient(rgba(229, 231, 235, 0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(229, 231, 235, 0.6) 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
      {/* Floating Glass Navbar */}
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-4xl">
        <div
          className="backdrop-blur-xl bg-white/40 rounded-full border border-white/40 shadow-2xl px-6 py-3"
          style={{
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.2)',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0.3) 100%)',
          }}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <img
                src="/logonav.png"
                alt="Personal B Logo"
                className="w-10 h-10"
              />
            </div>
            {!isOnboarding && (
              <Link href="/dashboard">
                <Button type="button" className="h-9 rounded-full bg-black hover:bg-gray-800 transition-elegant shadow-elegant px-5 text-sm">
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto space-y-8 pt-28">
        <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-black">
              {isOnboarding ? "Setup - Your CV" : hasExistingCV ? "Edit Your CV" : "Create Your CV"}
            </h1>
            <p className="text-sm text-gray-600">
              {isOnboarding ? "Step 1: Fill in your CV information" : hasExistingCV ? "Update your professional information" : "Fill in your professional information manually"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 text-sm text-green-600 bg-green-50 border border-green-100 rounded-xl flex justify-between items-center">
              <span>{success}</span>
              <Link href="/dashboard">
                <Button type="button" size="sm" className="rounded-full">
                  View Dashboard
                </Button>
              </Link>
            </div>
          )}

          {/* Personal Information */}
          <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100 space-y-6">
            <h2 className="text-2xl font-bold text-black flex items-center">
              <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Personal Information
            </h2>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-elegant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-elegant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-elegant"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary" className="text-sm font-medium text-gray-700">Professional Summary</Label>
              <textarea
                id="summary"
                className="w-full min-h-[100px] px-4 py-3 border border-gray-200 rounded-xl text-black placeholder:text-gray-400 focus:border-black focus:ring-black transition-elegant"
                placeholder="Brief professional summary..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100 space-y-6">
            <h2 className="text-2xl font-bold text-black flex items-center">
              <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span>
              Skills
            </h2>
            <div className="space-y-2">
              <Label htmlFor="skills" className="text-sm font-medium text-gray-700">Skills (comma separated)</Label>
              <Input
                id="skills"
                type="text"
                placeholder="JavaScript, React, Node.js, Python"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-elegant"
              />
            </div>
          </div>

          {/* Passions */}
          <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100 space-y-6">
            <h2 className="text-2xl font-bold text-black flex items-center">
              <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </span>
              Passions
            </h2>
            <div className="space-y-2">
              <Label htmlFor="passions" className="text-sm font-medium text-gray-700">Passions (comma separated)</Label>
              <Input
                id="passions"
                type="text"
                placeholder="Open Source, AI, Music"
                value={passions}
                onChange={(e) => setPassions(e.target.value)}
                disabled={isLoading}
                className="h-12 rounded-xl border-gray-200 focus:border-black focus:ring-black transition-elegant"
              />
            </div>
          </div>

          {/* Experiences */}
          <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black flex items-center">
                <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                Work Experience
              </h2>
              <Button type="button" onClick={addExperience} disabled={isLoading} className="rounded-full bg-black hover:bg-gray-800">
                Add Experience
              </Button>
            </div>

            {experiences.map((exp, index) => (
              <div key={index} className="space-y-4 pb-6 border-b border-gray-200 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-black text-lg">Experience {index + 1}</h3>
                  {experiences.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeExperience(index)}
                      disabled={isLoading}
                      className="text-sm h-8 rounded-full bg-red-600 hover:bg-red-700 px-4"
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
                    className="h-11 rounded-xl border-gray-200"
                  />
                  <Input
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl border-gray-200"
                  />
                  <Input
                    type="date"
                    placeholder="Start Date"
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                    disabled={isLoading}
                    className="h-11 rounded-xl border-gray-200"
                  />
                  <Input
                    type="date"
                    placeholder="End Date"
                    value={exp.endDate || ""}
                    onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                    disabled={isLoading || exp.current}
                    className="h-11 rounded-xl border-gray-200"
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
                  className="w-full min-h-[80px] px-4 py-3 border border-gray-200 rounded-xl text-black placeholder:text-gray-400 focus:border-black focus:ring-black transition-elegant"
                  placeholder="Job description..."
                  value={exp.description}
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black flex items-center">
                <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </span>
                Education
              </h2>
              <Button type="button" onClick={addEducation} disabled={isLoading} className="rounded-full bg-black hover:bg-gray-800">
                Add Education
              </Button>
            </div>

            {education.map((edu, index) => (
              <div key={index} className="space-y-4 pb-6 border-b border-gray-200 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-black text-lg">Education {index + 1}</h3>
                  {education.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeEducation(index)}
                      disabled={isLoading}
                      className="text-sm h-8 rounded-full bg-red-600 hover:bg-red-700 px-4"
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
          <div className="bg-white rounded-3xl shadow-elegant-lg p-8 border border-gray-100 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black flex items-center">
                <span className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </span>
                Projects
              </h2>
              <Button type="button" onClick={addProject} disabled={isLoading} className="rounded-full bg-black hover:bg-gray-800">
                Add Project
              </Button>
            </div>

            {projects.map((proj, index) => (
              <div key={index} className="space-y-4 pb-6 border-b border-gray-200 last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-black text-lg">Project {index + 1}</h3>
                  {projects.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeProject(index)}
                      disabled={isLoading}
                      className="text-sm h-8 rounded-full bg-red-600 hover:bg-red-700 px-4"
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

          <Button type="submit" className="w-full h-12 rounded-xl bg-black hover:bg-gray-800 transition-elegant shadow-elegant text-base font-medium" disabled={isLoading}>
            {isLoading ? (hasExistingCV ? "Updating CV..." : "Saving CV...") : (hasExistingCV ? "Update CV" : "Save CV")}
          </Button>
        </form>
      </div>
    </div>
  )
}
