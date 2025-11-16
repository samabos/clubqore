import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import { Building2, Upload } from "lucide-react";
import { ClubLogoUploadProps } from "../types/component-types";

export function ClubLogoUpload({
  clubLogo,
  onLogoUpload,
}: ClubLogoUploadProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-32 h-32 rounded-2xl shadow-lg">
          {clubLogo ? (
            <AvatarImage src={clubLogo} className="rounded-2xl object-cover" />
          ) : (
            <AvatarFallback className="rounded-2xl bg-gradient-to-br from-green-400 to-green-600 text-white text-2xl">
              <Building2 className="w-12 h-12" />
            </AvatarFallback>
          )}
        </Avatar>
        <label
          htmlFor="logo-upload"
          className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors"
        >
          <Upload className="w-4 h-4" />
        </label>
        <input
          id="logo-upload"
          type="file"
          accept="image/*"
          onChange={onLogoUpload}
          className="hidden"
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">Club Logo</p>
        <p className="text-xs text-gray-500">
          Upload your club's logo or badge
        </p>
      </div>
    </div>
  );
}
