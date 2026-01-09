import React from "react";
import { LayoutDashboard, MessageSquareText, FileLock2, Settings, ShieldCheck, HeartPulse } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";
export function AppSidebar(): JSX.Element {
  const activeTab = useAppStore(s => s.activeTab);
  const setActiveTab = useAppStore(s => s.setActiveTab);
  const insuranceState = useAppStore(s => s.insuranceState);
  const percentage = Math.round(
    (insuranceState.deductibleUsed / (insuranceState.deductibleTotal || 1)) * 100
  );
  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-bold text-sm">Legacy Health</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Navigator</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Core Ops</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Dashboard" isActive={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>
                <LayoutDashboard className="h-4 w-4" /> <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Forensic Chat" isActive={activeTab === 'chat'} onClick={() => setActiveTab('chat')}>
                <MessageSquareText className="h-4 w-4" /> <span>Forensic Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Document Vault" isActive={activeTab === 'vault'} onClick={() => setActiveTab('vault')}>
                <FileLock2 className="h-4 w-4" /> <span>Document Vault</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Preferences</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings className="h-4 w-4" /> <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="space-y-3 rounded-lg bg-blue-50/50 p-3 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <HeartPulse className="h-3 w-3" />
            <span>YTD Deductible</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>${insuranceState.deductibleUsed.toLocaleString()} used</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-1 bg-blue-100 dark:bg-blue-900" />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}