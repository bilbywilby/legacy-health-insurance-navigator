import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ShieldCheck } from "lucide-react";
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
  onVaultClick?: () => void;
};
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className={className}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 sm:px-6">
          <SidebarTrigger />
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              <span className="font-semibold tracking-tight hidden sm:inline-block">Legacy Navigator</span>
            </div>
            <ThemeToggle className="static" />
          </div>
        </header>
        {container ? (
          <main className={"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12 w-full" + (contentClassName ? ` ${contentClassName}` : "")}>
            {children}
          </main>
        ) : (
          <main className="flex-1 w-full">{children}</main>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}