import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Play, Users, Eye, Radio, Clock, Heart, Video } from "lucide-react";
import BottomNavigation from "@/components/bottom-navigation";

export default function StreamsHome() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  // جلب البثوث المباشرة
  const { data: streams = [] } = useQuery<any[]>({
    queryKey: ['/api/streams'], 
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <div className="text-2xl animate-bounce">🐰</div>
              <h1 className="text-xl font-bold text-laa-pink">LaaBoBo</h1>
            </div>
            <div className="flex-1"></div>
            {/* Live Stream Button */}
            <Button
              onClick={() => setLocation('/start-stream')}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm flex items-center space-x-1 rtl:space-x-reverse"
            >
              <Radio className="w-4 h-4" />
              <span>ابدأ البث</span>
            </Button>
          </div>
        </div>
        {/* Colored Line */}
        <div className="h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-60"></div>
      </div>



      <div className="max-w-sm mx-auto">
        {/* الصفحة الرئيسية - البثوث المباشرة */}
        <div className="p-2">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">🏠 الرئيسية</h2>
            <p className="text-gray-600 text-sm">شاهد البثوث المباشرة من الأصدقاء</p>
          </div>
          
          {streams.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎥</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                لا توجد بثوث مباشرة
              </h3>
              <p className="text-gray-500">
                لا يوجد أحد يبث الآن، انتظر حتى يبدأ أحد الأصدقاء بثاً مباشراً
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {streams.map((stream: any) => (
                <Card 
                  key={stream.id} 
                  className="overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer bg-white border-2 border-transparent hover:border-purple-200"
                  onClick={() => {
                    console.log('🎯 Joining stream:', stream.id);
                    setLocation(`/stream/${stream.id}`);
                  }}
                >
                  <CardContent className="p-0">
                    {/* Live Stream Preview */}
                    <div className="relative h-56 overflow-hidden">
                      {/* Enhanced Live Stream Preview with Real Simulation */}
                      <div className="w-full h-full bg-black relative overflow-hidden">
                        {/* Realistic Video Feed Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900">
                          
                          {/* Simulated Live Video Content */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {/* Video noise effect */}
                            <div className="absolute inset-0 opacity-10">
                              <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+PGRlZnM+PHBhdHRlcm4gaWQ9InBhdHRlcm4iIHg9IjAiIHk9IjAiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IndoaXRlIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] animate-pulse"></div>
                            </div>
                            
                            {/* Live Streamer in Action */}
                            <div className="relative z-20 text-center">
                              {/* Main streamer avatar - larger and more prominent */}
                              <div className="w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl border-4 border-white/80 relative overflow-hidden">
                                {stream.hostProfileImage ? (
                                  <img 
                                    src={stream.hostProfileImage} 
                                    alt={stream.hostName}
                                    className="w-32 h-32 rounded-full object-cover animate-pulse"
                                  />
                                ) : (
                                  <span className="text-4xl font-bold text-white animate-pulse">
                                    {stream.hostName?.[0]?.toUpperCase() || stream.hostId?.[0]?.toUpperCase() || 'S'}
                                  </span>
                                )}
                                
                                {/* Animated talking indicator */}
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                                  <div className="w-4 h-4 bg-white rounded-full animate-ping"></div>
                                </div>
                              </div>
                              
                              {/* Streamer info */}
                              <div className="text-white">
                                <h4 className="font-bold text-xl mb-2 text-shadow-lg">{stream.hostName || 'مضيف البث'}</h4>
                                <div className="flex items-center justify-center gap-2 text-sm bg-red-600/80 px-4 py-2 rounded-full backdrop-blur-sm border border-red-400/50">
                                  <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                                  <span className="font-semibold">مباشر الآن</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Live chat simulation */}
                            <div className="absolute bottom-4 left-4 right-4 space-y-2">
                              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white text-xs opacity-80 animate-fade-in">
                                <span className="text-blue-300">مشاهد1:</span> أهلاً وسهلاً! 👋
                              </div>
                              <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white text-xs opacity-60 animate-fade-in" style={{animationDelay: '2s'}}>
                                <span className="text-green-300">مشاهد2:</span> بث رائع! ❤️
                              </div>
                            </div>
                            
                            {/* Floating particles for activity */}
                            <div className="absolute top-6 left-6 w-2 h-2 bg-yellow-400 rounded-full animate-bounce opacity-70"></div>
                            <div className="absolute top-12 right-8 w-1 h-1 bg-blue-400 rounded-full animate-bounce opacity-60" style={{animationDelay: '0.5s'}}></div>
                            <div className="absolute bottom-16 left-12 w-1 h-1 bg-pink-400 rounded-full animate-bounce opacity-50" style={{animationDelay: '1s'}}></div>
                          </div>
                        </div>
                      </div>

                      {/* Live indicator with pulsing effect */}
                      <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-ping"></div>
                        مباشر
                      </div>

                      {/* Real-time viewer count */}
                      <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs flex items-center animate-fade-in">
                        <Eye className="w-3 h-3 mr-1 animate-pulse" />
                        <span className="font-bold">{stream.viewerCount || 0}</span>
                      </div>

                      {/* Stream category badge */}
                      <div className="absolute bottom-3 left-3 bg-purple-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-md text-xs font-semibold">
                        {stream.category || 'بث سريع'}
                      </div>

                      {/* Interactive join overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 cursor-pointer z-20">
                        <div className="bg-white/30 backdrop-blur-sm rounded-full p-4 shadow-xl transform hover:scale-110 transition-transform">
                          <Play className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm">
                          انقر لدخول البث كاملاً
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Stream Info */}
                    <div className="p-5">
                      <div className="mb-4">
                        <h3 className="font-bold text-xl text-gray-800 mb-2 line-clamp-2">
                          {stream.title || 'بث مباشر'}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {stream.description || 'انضم للبث المباشر الآن'}
                        </p>
                      </div>

                      {/* Stream metadata */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>منذ {Math.floor((Date.now() - new Date(stream.startedAt).getTime()) / 60000)} دقيقة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{stream.totalGifts || 0}</span>
                        </div>
                      </div>

                      {/* Join button */}
                      <button className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
                        <Play className="w-5 h-5 mr-2" />
                        انضم للبث المباشر
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
}