'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGetProjectsQuery } from '@/lib/api/projectApi'
import { useAuth } from '@/hooks/useAuth'
import { FolderKanban, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function MyProjectsPage() {
  const { user } = useAuth()
  const { data:projectsData, isLoading } = useGetProjectsQuery({ page: 1, limit: 20 })

  const projects = projectsData?.data?.projects || []

 console.log(projects)



  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">Projects you're working on</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle>{project.title}</CardTitle>
                    <CardDescription>{project.client}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(project.startDate).toLocaleDateString()} -{' '}
                          {new Date(project.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {project.stats && (
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">
                              {project.stats.progressPercentage.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${project.stats.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects</h3>
              <p className="text-muted-foreground">You're not assigned to any projects yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

