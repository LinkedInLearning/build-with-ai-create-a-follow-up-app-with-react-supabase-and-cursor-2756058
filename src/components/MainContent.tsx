import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Plus,
  MoreVertical,
} from "lucide-react";

const stats = [
  {
    title: "Total Users",
    value: "2,543",
    change: "+12%",
    changeType: "positive",
    icon: Users,
    description: "Total number of registered users",
  },
  {
    title: "Active Projects",
    value: "18",
    change: "+3",
    changeType: "positive",
    icon: FileText,
    description: "Number of currently active projects",
  },
  {
    title: "Meetings Today",
    value: "7",
    change: "2 upcoming",
    changeType: "neutral",
    icon: Calendar,
    description: "Total meetings scheduled for today",
  },
  {
    title: "Revenue",
    value: "$45,231",
    change: "+8.2%",
    changeType: "positive",
    icon: TrendingUp,
    description: "Total revenue this month",
  },
];

const recentActivities = [
  {
    id: 1,
    title: "New user registration",
    description: "John Smith created an account",
    time: "2 minutes ago",
    type: "user",
  },
  {
    id: 2,
    title: "Project completed",
    description: "Website redesign project was marked as complete",
    time: "1 hour ago",
    type: "project",
  },
  {
    id: 3,
    title: "Meeting scheduled",
    description: "Team standup meeting for tomorrow at 9:00 AM",
    time: "3 hours ago",
    type: "meeting",
  },
  {
    id: 4,
    title: "Document uploaded",
    description: "Project requirements.pdf was added to Documents",
    time: "5 hours ago",
    type: "document",
  },
];

const upcomingTasks = [
  {
    id: 1,
    title: "Review quarterly reports",
    dueDate: "Today, 3:00 PM",
    priority: "high",
    assignee: "You",
  },
  {
    id: 2,
    title: "Client presentation prep",
    dueDate: "Tomorrow, 10:00 AM",
    priority: "medium",
    assignee: "Sarah Johnson",
  },
  {
    id: 3,
    title: "Update project timeline",
    dueDate: "Dec 25, 2024",
    priority: "low",
    assignee: "Mike Chen",
  },
];

export function MainContent() {
  return (
    <main
      id="main-content"
      className="flex-1 overflow-y-auto bg-background"
      role="main"
      aria-label="Dashboard content"
    >
      <div className="p-4 md:p-6">
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Welcome back! Here's what's happening with your projects.
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New Project
          </Button>
        </header>

        {/* Stats Grid */}
        <section aria-labelledby="stats-heading" className="mb-8">
          <h2 id="stats-heading" className="sr-only">
            Key Statistics
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article
                  key={stat.title}
                  className="rounded-lg border bg-card p-4 md:p-6 text-card-foreground shadow-sm"
                  aria-labelledby={`stat-${stat.title
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3
                        id={`stat-${stat.title
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                        className="text-sm font-medium text-muted-foreground"
                      >
                        {stat.title}
                      </h3>
                      <p className="text-xl md:text-2xl font-bold">
                        {stat.value}
                      </p>
                      <p
                        className={`text-xs ${
                          stat.changeType === "positive"
                            ? "text-green-600"
                            : stat.changeType === "negative"
                            ? "text-red-600"
                            : "text-muted-foreground"
                        }`}
                        aria-label={`${
                          stat.changeType === "positive"
                            ? "Increased"
                            : stat.changeType === "negative"
                            ? "Decreased"
                            : "Changed"
                        } by ${stat.change}`}
                      >
                        {stat.change}
                      </p>
                    </div>
                    <Icon
                      className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="sr-only">{stat.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activities */}
          <section
            aria-labelledby="activities-heading"
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <header className="flex items-center justify-between p-4 md:p-6 pb-4">
              <h2 id="activities-heading" className="text-lg font-semibold">
                Recent Activities
              </h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="More activities options"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </header>
            <div className="px-4 md:px-6 pb-4 md:pb-6">
              <ul className="space-y-4" role="list">
                {recentActivities.map((activity) => (
                  <li key={activity.id} role="listitem">
                    <article className="flex items-start space-x-3 p-3 rounded-md hover:bg-muted/50 transition-colors">
                      <div
                        className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <time
                          className="text-xs text-muted-foreground mt-1 block"
                          dateTime={activity.time}
                        >
                          {activity.time}
                        </time>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Upcoming Tasks */}
          <section
            aria-labelledby="tasks-heading"
            className="rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <header className="flex items-center justify-between p-4 md:p-6 pb-4">
              <h2 id="tasks-heading" className="text-lg font-semibold">
                Upcoming Tasks
              </h2>
              <Button
                variant="ghost"
                size="icon"
                aria-label="More tasks options"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </header>
            <div className="px-4 md:px-6 pb-4 md:pb-6">
              <ul className="space-y-4" role="list">
                {upcomingTasks.map((task) => (
                  <li key={task.id} role="listitem">
                    <article className="flex items-center justify-between p-3 rounded-md border">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium">{task.title}</h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                            aria-label={`Priority: ${task.priority}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Due:{" "}
                          <time dateTime={task.dueDate}>{task.dueDate}</time>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Assigned to: {task.assignee}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`More options for ${task.title}`}
                      >
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </article>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Additional Content */}
        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <article className="lg:col-span-2 rounded-lg border bg-card text-card-foreground shadow-sm p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4">Project Overview</h2>
            <div
              className="h-48 md:h-64 flex items-center justify-center bg-muted/20 rounded-md"
              role="img"
              aria-label="Project overview chart placeholder"
            >
              <p className="text-muted-foreground">Chart placeholder</p>
            </div>
          </article>

          <aside className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <nav aria-label="Quick actions">
              <ul className="space-y-3" role="list">
                <li role="listitem">
                  <Button className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Create New Task
                  </Button>
                </li>
                <li role="listitem">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
                    Schedule Meeting
                  </Button>
                </li>
                <li role="listitem">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                    Upload Document
                  </Button>
                </li>
                <li role="listitem">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" aria-hidden="true" />
                    Invite Team Member
                  </Button>
                </li>
              </ul>
            </nav>
          </aside>
        </section>
      </div>
    </main>
  );
}
