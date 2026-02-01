import React, { useState, useEffect } from "react";
import api from "../api";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Trash2,
  CheckCircle2,
  Inbox,
  Check,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/notifications");
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/notifications/${deleteId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Derived state
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.isRead : true
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="default" className="rounded-full px-2.5">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Manage your alerts and system messages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="hidden md:flex"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* Controls & Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
        <div className="bg-muted/50 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
              filter === "all"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            All Notifications
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
              filter === "unread"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            Unread
          </button>
        </div>

        {/* Mobile Mark All Read */}
        <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="md:hidden w-full sm:w-auto"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Mark all read
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-4 min-h-75">
        <AnimatePresence mode="popLayout">
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center space-y-4"
            >
              <div className="bg-muted/30 p-6 rounded-full">
                {filter === 'unread' ? <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" /> : <Inbox className="h-12 w-12 text-muted-foreground/50" />}
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-lg text-foreground">
                  {filter === 'unread' ? "All caught up" : "No notifications yet"}
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  {filter === 'unread' 
                    ? "You have no unread messages. Check the 'All' tab for history." 
                    : "We'll notify you when something important happens."}
                </p>
              </div>
            </motion.div>
          ) : (
            filteredNotifications.map((notification) => (
              <motion.div
                layout
                key={notification._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={cn(
                    "py-3 group relative overflow-hidden h-24 transition-all duration-200 border shadow-sm hover:shadow-md",
                    !notification.isRead ? "bg-card" : "bg-card/50 opacity-90 hover:opacity-100"
                  )}
                >
                  <div className="p-2 sm:p-2 flex gap-4 items-start">
                    {/* Icon / Indicator */}
                    <div className="shrink-0">
                      {!notification.isRead ? (
                        <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 ring-4 ring-primary/10" />
                      ) : (
                        <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30 mt-1.5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={cn(
                          "font-semibold text-base leading-none tracking-tight",
                          !notification.isRead ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-[90%]">
                        {notification.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 self-center sm:self-start opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                          title="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(notification._id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
