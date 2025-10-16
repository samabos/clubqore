import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Checkbox } from "../../ui/checkbox";
import { Mail, Send } from "lucide-react";
import { Badge } from "../../ui/badge";

export function InvitationForm() {
  const [bulkMode, setBulkMode] = useState(false);
  const [emails, setEmails] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sendCopy, setSendCopy] = useState(true);

  // TODO: Get current user's club information from auth context
  // For now using mock data - replace with actual user club data
  const currentUserClub = {
    id: "manchester-united",
    name: "Manchester United Youth",
  };

  const handleSendInvitation = () => {
    const clubInfo = currentUserClub; // Use current user's club

    if (bulkMode) {
      const emailList = emails
        .split(/[,\n]/)
        .map((email) => email.trim())
        .filter((email) => email);
      console.log(
        "Sending bulk invitations to:",
        emailList,
        "for club:",
        clubInfo
      );
      // TODO: Implement bulk invitation API call
    } else {
      console.log("Sending single invitation to:", singleEmail);
      // TODO: Implement single invitation API call
    }
  };

  const getEmailCount = () => {
    if (!bulkMode) return singleEmail ? 1 : 0;
    return emails
      .split(/[,\n]/)
      .map((email) => email.trim())
      .filter((email) => email).length;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send Invitation
          </CardTitle>
          <CardDescription className="text-gray-600">
            Send invitations to join {currentUserClub.name}. Recipients will
            choose their role (member or parent) during registration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Current Club Display */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {currentUserClub.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Inviting to: {currentUserClub.name}
                </p>
                <p className="text-sm text-gray-600">
                  All invitations will be for this club
                </p>
              </div>
            </div>
          </div>

          {/* Invitation Mode Toggle */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="bulk-mode"
                checked={bulkMode}
                onCheckedChange={(checked) => setBulkMode(checked as boolean)}
              />
              <Label htmlFor="bulk-mode" className="cursor-pointer">
                Send multiple invitations at once
              </Label>
            </div>
          </div>

          {/* Email Input */}
          {bulkMode ? (
            <div className="space-y-2">
              <Label
                htmlFor="emails"
                className="text-sm font-medium text-gray-700"
              >
                Email Addresses *
              </Label>
              <Textarea
                id="emails"
                placeholder="Enter email addresses separated by commas or new lines&#10;example@email.com, another@email.com&#10;third@email.com"
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                rows={6}
                className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
              />
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Separate multiple emails with commas or new lines
                </p>
                {getEmailCount() > 0 && (
                  <Badge variant="secondary" className="rounded-lg">
                    {getEmailCount()} email{getEmailCount() !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-700"
                >
                  First Name (Optional)
                </Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-700"
                >
                  Last Name (Optional)
                </Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          {/* Custom Message */}
          <div className="space-y-2">
            <Label
              htmlFor="message"
              className="text-sm font-medium text-gray-700"
            >
              Custom Message (Optional)
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation email..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="rounded-xl border-gray-200 focus:border-primary focus:ring-primary/20"
            />
            <p className="text-sm text-gray-500">
              This message will be included in the invitation email
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="send-copy"
                checked={sendCopy}
                onCheckedChange={(checked) => setSendCopy(checked as boolean)}
              />
              <Label htmlFor="send-copy" className="cursor-pointer">
                Send me a copy of the invitation
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <Button
              onClick={handleSendInvitation}
              disabled={
                (!bulkMode && !singleEmail) ||
                (bulkMode && getEmailCount() === 0)
              }
              className="flex-1 rounded-xl py-3 gradient-primary text-white hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4 mr-2" />
              Send{" "}
              {bulkMode && getEmailCount() > 1 ? `${getEmailCount()} ` : ""}
              Invitation{bulkMode && getEmailCount() > 1 ? "s" : ""}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl px-8 py-3 border-gray-200 hover:border-gray-300"
              onClick={() => {
                setEmails("");
                setSingleEmail("");
                setFirstName("");
                setLastName("");
                setCustomMessage("");
                setBulkMode(false);
              }}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Card */}
      {((!bulkMode && singleEmail) || (bulkMode && getEmailCount() > 0)) && (
        <Card className="border-0 shadow-lg rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              Invitation Preview
            </CardTitle>
            <CardDescription className="text-gray-600">
              Here's how your invitation will look
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-xl p-6 border">
              <div className="text-center mb-6">
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">CQ</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  You're Invited!
                </h3>
                <p className="text-gray-600">
                  You've been invited to join {currentUserClub.name}. Choose
                  your role during registration.
                </p>
              </div>

              {customMessage && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-gray-700 italic">"{customMessage}"</p>
                </div>
              )}

              <div className="text-center">
                <Button className="rounded-xl gradient-primary text-white">
                  Complete Registration
                </Button>
                <p className="text-xs text-gray-500 mt-3">
                  This invitation will expire in 7 days
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
