import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useRequestResponses } from "@/hooks/useJobRequests";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Clock, MapPin, DollarSign, CalendarCheck, MessageSquare, User, ExternalLink, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { ReviewingIndicator } from "@/components/activity/LiveActivityIndicators";

export default function RequestStatusPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading } = useRequestResponses(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <h2 className="text-xl font-semibold">Request not found</h2>
        <p className="text-muted-foreground text-sm">This link may have expired or is invalid.</p>
        <Link to="/request-service">
          <Button>Submit a New Request</Button>
        </Link>
      </div>
    );
  }

  const { request, responses } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Helmet>
        <title>Your Service Request | CardPilot</title>
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {/* Request summary */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Your Request</CardTitle>
              <Badge variant={request.status === "pending" ? "secondary" : "default"} className="text-xs">
                {request.status === "pending" ? "Awaiting Responses" : request.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Service</p>
                <p className="font-medium">{request.service_needed || "General"}</p>
              </div>
              {request.location && (
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {request.location}</p>
                </div>
              )}
              {request.budget && (
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="font-medium flex items-center gap-1"><DollarSign className="h-3 w-3" /> {request.budget}</p>
                </div>
              )}
              {request.timeline && (
                <div>
                  <p className="text-xs text-muted-foreground">Timeline</p>
                  <p className="font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> {request.timeline}</p>
                </div>
              )}
            </div>
            {request.request_details && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Details</p>
                <p className="text-sm">{request.request_details}</p>
              </div>
            )}
            <p className="text-2xs text-muted-foreground">
              Submitted {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </p>
          </CardContent>
        </Card>

        {/* Responses */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Responses ({responses.length})
          </h2>

          {responses.length === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="py-12 text-center">
                <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No responses yet. Professionals have been notified and will respond soon.</p>
                <p className="text-xs text-muted-foreground mt-1">Most respond within 1 hour.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {responses.map((response, i) => (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border-border hover:shadow-md transition-shadow">
                     <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={response.profile?.avatar_url || ""} />
                          <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{response.profile?.company || response.profile?.name || "Professional"}</p>
                            {response.profile?.city && (
                              <Badge variant="outline" className="text-2xs gap-1">
                                <MapPin className="h-2.5 w-2.5" /> {response.profile.city}
                              </Badge>
                            )}
                          </div>
                          {/* Trust signals */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {i === 0 && (
                              <Badge variant="outline" className="text-2xs gap-1 border-primary/30 bg-primary/5 text-primary">
                                <Clock className="h-2.5 w-2.5" /> First to respond
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground mt-2">{response.message}</p>

                          <div className="flex items-center gap-4 mt-3 text-sm">
                            {response.price_estimate && (
                              <span className="flex items-center gap-1 font-medium text-primary">
                                <DollarSign className="h-3.5 w-3.5" />
                                ${response.price_estimate.toLocaleString()}
                              </span>
                            )}
                            {response.availability && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <CalendarCheck className="h-3.5 w-3.5" />
                                {response.availability}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-4">
                            {response.profile?.handle && (
                              <Link to={`/${response.profile.handle}`}>
                                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                                  <ExternalLink className="h-3 w-3" /> View Profile
                                </Button>
                              </Link>
                            )}
                            {response.profile?.handle && (
                              <Link to={`/${response.profile.handle}?action=book`}>
                                <Button size="sm" className="text-xs gap-1.5">
                                  <CalendarCheck className="h-3 w-3" /> Book
                                </Button>
                              </Link>
                            )}
                          </div>

                          <p className="text-2xs text-muted-foreground mt-2">
                            Responded {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
