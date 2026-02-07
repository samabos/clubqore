import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff, User, Phone, Building2, MapPin } from "lucide-react";
import { ClubManagerSignUpData } from "@/types/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface ClubAddress {
  street: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
}

const UK_COUNTRIES = ['England', 'Scotland', 'Wales', 'Northern Ireland'] as const;

interface ClubManagerSignUpFormProps {
  formData: ClubManagerSignUpData;
  setFormData: React.Dispatch<React.SetStateAction<ClubManagerSignUpData>>;
  isLoading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToSignIn: () => void;
}

export function ClubManagerSignUpForm({
  formData,
  setFormData,
  isLoading,
  error,
  onSubmit,
  onSwitchToSignIn,
}: ClubManagerSignUpFormProps) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Parse address from formData
  const getAddressField = (field: keyof ClubAddress): string => {
    if (typeof formData.clubAddress === 'object' && formData.clubAddress !== null) {
      return (formData.clubAddress as ClubAddress)[field] || '';
    }
    return '';
  };

  const updateAddressField = (field: keyof ClubAddress, value: string) => {
    const currentAddress = typeof formData.clubAddress === 'object' && formData.clubAddress !== null
      ? formData.clubAddress as ClubAddress
      : { street: '', city: '', county: '', postcode: '', country: 'England' };

    setFormData(prev => ({
      ...prev,
      clubAddress: { ...currentAddress, [field]: value }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      return;
    }
    onSubmit(e);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-2xl rounded-2xl">
      <CardHeader className="text-center pb-6">
        <Button
          variant="ghost"
          className="flex items-center justify-center gap-3 mb-4 p-0 h-auto hover:bg-transparent cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">CQ</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ClubQore</h1>
          </div>
        </Button>
        <CardTitle className="text-xl text-gray-900">Create Your Club Account</CardTitle>
        <CardDescription className="text-gray-600">
          Register as a club manager to start managing your football club
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Personal Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="pl-10 rounded-xl border-gray-200"
                    placeholder="First name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="rounded-xl border-gray-200"
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 rounded-xl border-gray-200"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="pl-10 rounded-xl border-gray-200"
                  placeholder="Phone number (optional)"
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Password</h3>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10 pr-10 rounded-xl border-gray-200"
                  placeholder="Create a password"
                  required
                  minLength={8}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="pl-10 pr-10 rounded-xl border-gray-200"
                  placeholder="Confirm your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Club Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Club Information</h3>

            <div className="space-y-2">
              <Label htmlFor="clubName">Club Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="clubName"
                  value={formData.clubName}
                  onChange={(e) => setFormData(prev => ({ ...prev, clubName: e.target.value }))}
                  className="pl-10 rounded-xl border-gray-200"
                  placeholder="Enter club name"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Club Address
              </Label>

              <div className="space-y-2">
                <Label htmlFor="street" className="text-sm font-normal text-gray-600">Street Address</Label>
                <Input
                  id="street"
                  value={getAddressField('street')}
                  onChange={(e) => updateAddressField('street', e.target.value)}
                  className="rounded-xl border-gray-200"
                  placeholder="10 Stadium Road"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-normal text-gray-600">City</Label>
                  <Input
                    id="city"
                    value={getAddressField('city')}
                    onChange={(e) => updateAddressField('city', e.target.value)}
                    className="rounded-xl border-gray-200"
                    placeholder="London"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="county" className="text-sm font-normal text-gray-600">County</Label>
                  <Input
                    id="county"
                    value={getAddressField('county')}
                    onChange={(e) => updateAddressField('county', e.target.value)}
                    className="rounded-xl border-gray-200"
                    placeholder="Greater London"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postcode" className="text-sm font-normal text-gray-600">Postcode</Label>
                  <Input
                    id="postcode"
                    value={getAddressField('postcode')}
                    onChange={(e) => updateAddressField('postcode', e.target.value.toUpperCase())}
                    className="rounded-xl border-gray-200"
                    placeholder="SW1A 1AA"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-normal text-gray-600">Country</Label>
                  <select
                    id="country"
                    value={getAddressField('country') || 'England'}
                    onChange={(e) => updateAddressField('country', e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-gray-200 bg-background px-3 py-2 text-sm focus:border-primary focus:ring-primary/20 focus:outline-none"
                  >
                    {UK_COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm leading-5 cursor-pointer">
              I agree to the{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </a>
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl gradient-primary text-white hover:opacity-90 py-3"
            disabled={isLoading || !agreedToTerms}
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSwitchToSignIn}
              className="text-primary hover:text-primary/80 p-0 h-auto"
            >
              Sign in
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
