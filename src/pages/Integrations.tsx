import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCircle, Send, Settings, CheckCircle, Circle, Clock, Link, Unlink } from "lucide-react";

interface Channel {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastActivity: string;
  channels: Channel[];
}

const INTEGRATIONS: Integration[] = [
{
  id: "openclaw",
  name: "OpenClaw",
  description: "AI-powered messaging gateway for strategy submission via WhatsApp and Telegram.",
  connected: false,
  lastActivity: "—",
  channels: [
  { name: "WhatsApp", icon: <MessageCircle className="h-4 w-4" />, connected: false },
  { name: "Telegram", icon: <Send className="h-4 w-4" />, connected: false }]

}];


export default function Integrations() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  const toggleConnection = (integrationId: string) => {
    setIntegrations((prev) =>
    prev.map((i) => {
      if (i.id !== integrationId) return i;
      const newConnected = !i.connected;
      return {
        ...i,
        connected: newConnected,
        lastActivity: newConnected ? "Just now" : "—",
        channels: i.channels.map((c) =>
          c.name === "WhatsApp" ? { ...c, connected: newConnected } : c
        ),
      };
    })
    );
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          <span className="text-gradient">Integrations</span>
        </h1>
        <p className="text-muted-foreground">
          Connect messaging channels to submit and manage strategies directly from your favorite apps.
        </p>
      </div>

      {/* Messaging Flow Overview */}
      













      

      {/* Integration Cards */}
      {integrations.map((integration) =>
      <Card key={integration.id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <CardTitle className="text-xl">{integration.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">{integration.description}</p>
                </div>
              </div>
              <Badge
              variant="secondary"
              className={cn(
                "text-xs",
                integration.connected ?
                "bg-success/10 text-success border-success/20" :
                "bg-muted text-muted-foreground"
              )}>
              
                {integration.connected ? "Connected" : "Not Connected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  {integration.connected ?
                <CheckCircle className="h-4 w-4 text-success" /> :

                <Circle className="h-4 w-4 text-muted-foreground" />
                }
                  <span className="text-sm font-semibold">
                    {integration.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
              </div>
              <div className="glass-panel p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Connected Channels</p>
                <div className="flex items-center gap-2">
                  {integration.channels.filter((c) => c.connected).map((c) =>
                <Badge key={c.name} variant="secondary" className="text-[10px] gap-1">
                      {c.icon} {c.name}
                    </Badge>
                )}
                  {integration.channels.filter((c) => c.connected).length === 0 &&
                <span className="text-sm text-muted-foreground">None</span>
                }
                </div>
              </div>
              <div className="glass-panel p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Last Activity</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-mono">{integration.lastActivity}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {integration.connected ?
            <>
                  <Button variant="outline" size="sm" onClick={() => toggleConnection(integration.id)} className="gap-1.5">
                    <Unlink className="h-3.5 w-3.5" /> Disconnect
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Settings className="h-3.5 w-3.5" /> View Settings
                  </Button>
                </> :

            <Button size="sm" onClick={() => toggleConnection(integration.id)} className="gap-1.5">
                  <Link className="h-3.5 w-3.5" /> Connect
                </Button>
            }
            </div>

            {/* Channels List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Channels</h3>
              <div className="space-y-2">
                {integration.channels.map((channel) =>
              <div
                key={channel.name}
                 className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/30 transition-colors">
                
                    <div className="flex items-center gap-2.5">
                      <span className={cn(channel.connected ? "text-success" : "text-muted-foreground")}>
                        {channel.icon}
                      </span>
                      <span className="text-sm font-medium">{channel.name}</span>
                    </div>
                    <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px]",
                    channel.connected ?
                    "bg-success/10 text-success border-success/20" :
                    "bg-muted text-muted-foreground"
                  )}>
                  
                      {channel.connected ? "✓ Connected" : "Not Connected"}
                    </Badge>
                  </div>
              )}
              </div>
            </div>

            {/* Messaging Flow Preview */}
            {integration.connected &&
          <div className="glass-panel p-5 space-y-3">
                <h3 className="text-sm font-semibold">Message Flow Preview</h3>
                <div className="space-y-2">
                  {[
              { step: 1, text: "User sends strategy text via message" },
              { step: 2, text: "System auto-creates Strategy Draft" },
              { step: 3, text: 'User receives: "Strategy detected. Deploy with default settings?"' },
              { step: 4, text: "Deploy → Auto backtest → Push results" },
              { step: 5, text: "Edit → Redirect to Strategy Builder on web" }].
              map((item) =>
              <div key={item.step} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-primary">{item.step}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.text}</p>
                    </div>
              )}
                </div>
              </div>
          }

            {/* Status Feedback Types */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Status Notifications</h3>
              <div className="flex flex-wrap gap-2">
                {[
              { label: "Draft Created", color: "bg-primary/10 text-primary border-primary/20" },
              { label: "Validation Needed", color: "bg-warning/10 text-warning border-warning/20" },
              { label: "Deployed", color: "bg-success/10 text-success border-success/20" },
              { label: "Backtest Running", color: "bg-primary/10 text-primary border-primary/20" },
              { label: "Rank Updated", color: "bg-success/10 text-success border-success/20" }].
              map((status) =>
              <Badge key={status.label} variant="secondary" className={cn("text-[10px]", status.color)}>
                    {status.label}
                  </Badge>
              )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>);

}