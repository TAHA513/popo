import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Video, Globe, Users, Gift, Star } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 gradient-bg rounded-full flex items-center justify-center">
                <span className="text-white text-lg">🐰</span>
              </div>
              <span className="font-bold text-2xl gradient-text">LaaBoBo Live</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Globe className="w-4 h-4" />
                <span>EN</span>
              </Button>
              
              <Button onClick={handleLogin} className="bg-laa-pink hover:bg-pink-600">
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="gradient-bg py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-bold text-5xl md:text-7xl text-white mb-6">
            Welcome to LaaBoBo Live
          </h1>
          <h2 className="text-2xl md:text-3xl text-white/90 mb-4">
            مرحباً بك في لاا بوبو لايف
          </h2>
          <p className="text-white/80 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Stream, connect, and earn with our amazing gift system and cute characters!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={handleLogin}
              size="lg"
              className="bg-white text-laa-pink hover:bg-gray-100 text-lg px-8 py-4"
            >
              <Video className="w-5 h-5 mr-2" />
              Start Streaming
            </Button>
            <Button
              onClick={handleLogin}
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white hover:text-laa-pink text-lg px-8 py-4"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Live
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-bold text-4xl text-laa-dark mb-4">
              Why Choose LaaBoBo Live?
            </h2>
            <p className="text-laa-gray text-lg max-w-2xl mx-auto">
              Experience the next generation of live streaming with unique features designed for creators and viewers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-laa-pink/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Gift className="w-8 h-8 text-laa-pink" />
                </div>
                <h3 className="font-bold text-xl mb-4">Unique Gift System</h3>
                <p className="text-gray-600">
                  Send magical gifts with our adorable characters: BoBo Love, BoFire, Nunu Magic, and more!
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-laa-purple/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-laa-purple" />
                </div>
                <h3 className="font-bold text-xl mb-4">Real-time Interaction</h3>
                <p className="text-gray-600">
                  Connect with your audience through live chat, real-time gifts, and interactive features
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-laa-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-8 h-8 text-laa-blue" />
                </div>
                <h3 className="font-bold text-xl mb-4">Earn & Grow</h3>
                <p className="text-gray-600">
                  Monetize your content with our fair revenue sharing system and build your streaming career
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Gift Characters Preview */}
      <section className="py-20 bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-bold text-4xl gradient-text mb-4">
              Meet Our Gift Characters
            </h2>
            <p className="text-laa-gray text-lg max-w-2xl mx-auto">
              Express yourself with our unique animated characters
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {[
              { name: 'BoBo Love', emoji: '🐰💕', cost: 100 },
              { name: 'BoFire', emoji: '🐲🔥', cost: 500 },
              { name: 'Nunu Magic', emoji: '🦄🌟', cost: 1000 },
              { name: 'Dodo Splash', emoji: '🦆💦', cost: 250 },
              { name: 'Meemo Wink', emoji: '🐱🌈', cost: 750 },
            ].map((character) => (
              <Card key={character.name} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{character.emoji}</div>
                  <h3 className="font-semibold mb-2">{character.name}</h3>
                  <Badge variant="secondary" className="bg-laa-pink/10 text-laa-pink">
                    {character.cost} Points
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-bold text-4xl text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of creators and viewers in the LaaBoBo Live community
          </p>
          
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-white text-laa-pink hover:bg-gray-100 text-lg px-12 py-4"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                <span className="text-white">🐰</span>
              </div>
              <span className="font-bold text-xl gradient-text">LaaBoBo Live</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-600">
                © 2025 LaaBoBo Live. All rights reserved.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Made with ❤️ for creators worldwide
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
