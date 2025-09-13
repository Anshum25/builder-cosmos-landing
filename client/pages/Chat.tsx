import { useRef, useState } from "react";
import { useChat } from "@/context/ChatContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Loader2, Send } from "lucide-react";

export default function Chat() {
  const { messages, send, sending } = useChat();
  const [text, setText] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const onSend = async () => {
    if (!text.trim()) return;
    await send(text.trim());
    setText("");
    containerRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  };

  return (
    <main className="min-h-[calc(100vh-56px)] bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50">
      <section className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[70vh] flex flex-col">
              <CardHeader>
                <CardTitle>Chat with your finances</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-3 pr-2" ref={containerRef}>
                {messages.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    Try:
                    <ul className="list-disc ml-5 mt-2 space-y-1">
                      <li>How much did I spend last month?</li>
                      <li>Why did my expenses increase last quarter?</li>
                      <li>Can I afford to take a vacation next month?</li>
                      <li>What's my best option for repaying my loan faster?</li>
                    </ul>
                  </div>
                )}
                {messages.map((m) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className={m.role === "user" ? "text-right" : "text-left"}>
                      <div
                        className={
                          m.role === "user"
                            ? "inline-block bg-primary text-primary-foreground px-3 py-2 rounded-lg"
                            : "inline-block bg-muted px-3 py-2 rounded-lg"
                        }
                      >
                        {m.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {sending && (
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Thinking...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Ask a question</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a question about your finances"
                    onKeyDown={(e) => e.key === "Enter" && onSend()}
                  />
                  <Button onClick={onSend} disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Tip: Ask follow-ups like "What about last 3 months?" to keep context.
                </div>
                <div className="space-y-1">
                  <Badge variant="secondary">Spending Pattern Analysis</Badge>
                  <Badge variant="secondary">Savings Forecast</Badge>
                  <Badge variant="secondary">Debt Repayment Strategy</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
