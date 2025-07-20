import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Edit, 
  DollarSign, 
  Users, 
  TrendingUp,
  Gift,
  Play,
  Heart
} from "lucide-react";

export default function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-600">Please log in to view your profile.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white" id="profile">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="gradient-bg rounded-2xl p-8 text-white mb-8">
            <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={user.profileImageUrl} />
                <AvatarFallback className="text-4xl bg-white text-laa-pink">
                  {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center md:text-left flex-1">
                <h2 className="font-bold text-3xl mb-2">
                  {user.firstName || user.username || 'User'}
                  {user.lastName && ` ${user.lastName}`}
                </h2>
                <p className="text-lg opacity-90 mb-4">
                  {user.bio || 'Content Creator | LaaBoBo Live Streamer'}
                </p>
                
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user.followers || 0}</div>
                    <div className="text-sm opacity-75">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm opacity-75">Gifts Received</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm opacity-75">Hours Streamed</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Button className="bg-white text-laa-pink hover:bg-gray-100 font-semibold">
                  <Video className="w-4 h-4 mr-2" />
                  Go Live
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-laa-pink">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>

          {/* Earnings Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-l-4 border-laa-pink">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">This Month</p>
                    <p className="text-2xl font-bold text-laa-dark">
                      ${parseFloat(user.totalEarnings).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-laa-pink bg-opacity-10 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-laa-pink" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-laa-purple">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Points</p>
                    <p className="text-2xl font-bold text-laa-dark">{user.points}</p>
                  </div>
                  <div className="w-12 h-12 bg-laa-purple bg-opacity-10 rounded-full flex items-center justify-center">
                    <span className="text-xl">💎</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-laa-blue">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Live Sessions</p>
                    <p className="text-2xl font-bold text-laa-dark">0</p>
                  </div>
                  <div className="w-12 h-12 bg-laa-blue bg-opacity-10 rounded-full flex items-center justify-center">
                    <Video className="w-6 h-6 text-laa-blue" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-lg">{user.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Username</label>
                  <p className="text-lg">{user.username || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Account Type</label>
                  <div className="flex items-center space-x-2">
                    <Badge className={user.isStreamer ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {user.isStreamer ? 'Streamer' : 'Viewer'}
                    </Badge>
                    {user.isAdmin && (
                      <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Streaming Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Streams</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Viewers</span>
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Watch Time</span>
                  <span className="font-semibold">0 hours</span>
                </div>
                <div className="pt-4">
                  <Button className="w-full bg-laa-pink hover:bg-pink-600">
                    <Play className="w-4 h-4 mr-2" />
                    Start Your First Stream
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Activity Yet</h3>
                <p className="text-gray-500 mb-6">
                  Start streaming or interacting with other creators to see your activity here.
                </p>
                <Button className="bg-laa-purple hover:bg-purple-600">
                  <Heart className="w-4 h-4 mr-2" />
                  Explore Streams
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
