"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { apiClient, ApiError, CVResponse } from "@/lib/api"
import Script from "next/script"

export default function DashboardPage() {
  const [cv, setCV] = useState<CVResponse | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [widgetLoaded, setWidgetLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkOnboardingAndLoadCV()
  }, [])

  useEffect(() => {
    // Charger le script ElevenLabs et initialiser le widget
    const loadWidget = () => {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
      script.async = true
      script.onload = () => {
        console.log('ElevenLabs widget script loaded')
        setWidgetLoaded(true)
      }
      script.onerror = () => {
        console.error('Failed to load ElevenLabs widget script')
      }
      document.body.appendChild(script)

      return () => {
        // Cleanup: retirer le script lors du démontage
        const existingScript = document.querySelector('script[src="https://unpkg.com/@elevenlabs/convai-widget-embed"]')
        if (existingScript) {
          document.body.removeChild(existingScript)
        }
      }
    }

    loadWidget()
  }, [])

  const checkOnboardingAndLoadCV = async () => {
    try {
      // Vérifier si l'utilisateur a complété l'onboarding
      const user = await apiClient.getCurrentUser()
      
      // Si pas de CV ou pas de photo, rediriger vers onboarding
      if (!user.cvId || !user.photoFilename) {
        router.push('/onboarding')
        return
      }

      // Charger le CV
      loadCV()
    } catch (err) {
      console.error("Erreur:", err)
      setIsLoading(false)
    }
  }

  const loadCV = async () => {
    try {
      setIsLoading(true)
      const cvData = await apiClient.getMyCV()
      setCV(cvData)
      setError("")
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.error || "No CV found")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    router.push("/cv/manual")
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your CV?")) {
      return
    }

    try {
      await apiClient.deleteCV()
      setCV(null)
      setError("CV deleted successfully")
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.error || "Error deleting CV")
    }
  }

  const handleLogout = () => {
    apiClient.logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-black pb-4">
          <div>
            <h1 className="text-3xl font-semibold text-black">My CV Dashboard</h1>
            <p className="text-sm text-gray-600">View and manage your CV information</p>
          </div>
          <div className="space-x-2">
            <Button onClick={handleEdit}>
              {cv ? "Edit CV" : "Create CV"}
            </Button>
            <Button onClick={handleLogout} className="bg-gray-600 hover:bg-gray-700">
              Logout
            </Button>
          </div>
        </div>

        {error && !cv && (
          <div className="p-4 text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleEdit}>Create Your CV</Button>
          </div>
        )}

        {cv && (
          <div className="space-y-6">
            {/* CV Info Badge */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">CV Type</p>
                <p className="font-medium text-black capitalize">{cv.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium text-black">
                  {new Date(cv.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete CV
              </Button>
            </div>

            {/* Personal Information */}
            {cv.data && (
              <>
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-black border-b pb-2">
                    Personal Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {cv.data.name && (
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="text-black font-medium">{cv.data.name}</p>
                      </div>
                    )}
                    {cv.data.email && (
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-black font-medium">{cv.data.email}</p>
                      </div>
                    )}
                    {cv.data.phone && (
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-black font-medium">{cv.data.phone}</p>
                      </div>
                    )}
                  </div>
                  {cv.data.summary && (
                    <div>
                      <p className="text-sm text-gray-600">Professional Summary</p>
                      <p className="text-black mt-1">{cv.data.summary}</p>
                    </div>
                  )}
                </div>

                {/* Skills */}
                {cv.data.skills && cv.data.skills.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-black border-b pb-2">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {cv.data.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Passions */}
                {cv.data.passions && cv.data.passions.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-black border-b pb-2">Passions</h2>
                    <div className="flex flex-wrap gap-2">
                      {cv.data.passions.map((passion, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {passion}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {cv.data.experiences && cv.data.experiences.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-black border-b pb-2">
                      Work Experience
                    </h2>
                    <div className="space-y-4">
                      {cv.data.experiences.map((exp, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-black">{exp.title}</h3>
                              <p className="text-gray-700">{exp.company}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {new Date(exp.startDate).toLocaleDateString()} -{" "}
                                {exp.current
                                  ? "Present"
                                  : exp.endDate
                                  ? new Date(exp.endDate).toLocaleDateString()
                                  : "N/A"}
                              </p>
                              {exp.current && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Current
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {cv.data.education && cv.data.education.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-black border-b pb-2">Education</h2>
                    <div className="space-y-4">
                      {cv.data.education.map((edu, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-black">{edu.degree}</h3>
                              <p className="text-gray-700">{edu.school}</p>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(edu.startDate).toLocaleDateString()} -{" "}
                              {edu.endDate
                                ? new Date(edu.endDate).toLocaleDateString()
                                : "Present"}
                            </p>
                          </div>
                          {edu.description && (
                            <p className="text-gray-600 text-sm">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {cv.data.projects && cv.data.projects.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-black border-b pb-2">Projects</h2>
                    <div className="space-y-4">
                      {cv.data.projects.map((project, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <h3 className="text-lg font-semibold text-black mb-2">
                            {project.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                          {project.technologies && project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {project.technologies.map((tech, techIndex) => (
                                <span
                                  key={techIndex}
                                  className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          )}
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              View Project →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ElevenLabs Coach Widget (apparaît en bas à droite) */}
      {widgetLoaded && (
        <div 
          dangerouslySetInnerHTML={{
            __html: '<elevenlabs-convai agent-id="agent_6001ka3sd553eyysf894edmrrp0j"></elevenlabs-convai>'
          }}
        />
      )}
    </div>
  )
}
