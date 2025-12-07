'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useGetProjectsQuery } from '@/lib/api/projectApi'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Search, FolderKanban, Calendar, DollarSign, Grid3x3, Table2 } from 'lucide-react'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ProjectsPage() {
  const { isAdminOrManager } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  
  const { data, isLoading } = useGetProjectsQuery({
    page,
    limit: 12,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
  })

  if (!isAdminOrManager) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  const allProjects = data?.data?.projects || []
  const pagination = data?.data?.pagination

  const uniqueClients = Array.from(new Set(allProjects.map(p => p.client))).sort()

  const filteredProjects = allProjects.filter(project => {
    if (clientFilter !== 'all' && project.client !== clientFilter) {
      return false
    }
    return true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">Manage all your projects</p>
          </div>
          <Link href="/projects/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 flex-col sm:flex-row items-end">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={clientFilter}
                onValueChange={setClientFilter}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {uniqueClients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-9 w-9 p-0"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="h-9 w-9 p-0"
                >
                  <Table2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading projects...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                          <CardDescription className="mt-1">{project.client}</CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(project.status)} capitalize`}>
                          {project.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {project.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {project.description}
                        </p>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(project.startDate).toLocaleDateString()} -{' '}
                            {new Date(project.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        {project.budget && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span>${project.budget.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Progress</span>
                            <span className="text-sm font-medium">
                              {project.stats?.progressPercentage.toFixed(0) || 0}%
                            </span>
                          </div>
                          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${project.stats?.progressPercentage || 0}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {project.stats?.completedTasks || 0} of {project.stats?.totalTasks || 0} tasks completed
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold text-sm">Title</th>
                        <th className="text-left p-4 font-semibold text-sm">Client</th>
                        <th className="text-left p-4 font-semibold text-sm">Status</th>
                        <th className="text-left p-4 font-semibold text-sm">Dates</th>
                        <th className="text-left p-4 font-semibold text-sm">Budget</th>
                        <th className="text-left p-4 font-semibold text-sm">Progress</th>
                        <th className="text-left p-4 font-semibold text-sm">Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((project) => (
                        <tr
                          key={project.id}
                          className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/projects/${project.id}`}
                        >
                          <td className="p-4">
                            <div className="font-medium">{project.title}</div>
                            {project.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {project.description}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-sm">{project.client}</td>
                          <td className="p-4">
                            <Badge className={`${getStatusColor(project.status)} capitalize`}>
                              {project.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            <div>{new Date(project.startDate).toLocaleDateString()}</div>
                            <div className="text-xs">{new Date(project.endDate).toLocaleDateString()}</div>
                          </td>
                          <td className="p-4 text-sm">
                            {project.budget ? (
                              <span className="font-medium">${project.budget.toLocaleString()}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{
                                    width: `${project.stats?.progressPercentage || 0}%`,
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-10">
                                {project.stats?.progressPercentage.toFixed(0) || 0}%
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {project.stats?.completedTasks || 0} / {project.stats?.totalTasks || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {search || statusFilter !== 'all' || clientFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first project'}
              </p>
              {!search && statusFilter === 'all' && clientFilter === 'all' && (
                <Link href="/projects/new">
                  <Button>Create Project</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}

        
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

