"use client";

import { useState } from "react";
import { MapPin, Navigation, Utensils, Music, Landmark, Star, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Category = "food" | "entertainment" | "culture";

interface Suggestion {
  id: string;
  name: string;
  description: string;
  rating: number;
  priceRange: string;
  category: Category;
  tags: string[];
}

// Mock data for demonstration
const mockSuggestions: Suggestion[] = [
  {
    id: "1",
    name: "The Local Kitchen",
    description: "Farm-to-table restaurant featuring seasonal ingredients and local craft beers.",
    rating: 4.7,
    priceRange: "$$",
    category: "food",
    tags: ["American", "Farm-to-Table", "Craft Beer"]
  },
  {
    id: "2",
    name: "Spice Route",
    description: "Authentic Indian cuisine with traditional tandoor dishes and vegetarian options.",
    rating: 4.5,
    priceRange: "$",
    category: "food",
    tags: ["Indian", "Vegetarian", "Lunch"]
  },
  {
    id: "3",
    name: "The Blue Note",
    description: "Intimate jazz club featuring live performances Thursday-Sunday.",
    rating: 4.8,
    priceRange: "$$",
    category: "entertainment",
    tags: ["Jazz", "Live Music", "Cocktails"]
  },
  {
    id: "4",
    name: "City Center Cinema",
    description: "Independent cinema showing classic films and new releases.",
    rating: 4.3,
    priceRange: "$",
    category: "entertainment",
    tags: ["Movies", "Indie", "Snacks"]
  },
  {
    id: "5",
    name: "Heritage Museum",
    description: "Local history museum featuring artifacts from the region's founding.",
    rating: 4.6,
    priceRange: "$",
    category: "culture",
    tags: ["History", "Museum", "Family-Friendly"]
  },
  {
    id: "6",
    name: "Art Walk Gallery",
    description: "Contemporary art gallery showcasing local and regional artists.",
    rating: 4.4,
    priceRange: "Free",
    category: "culture",
    tags: ["Art", "Gallery", "Free"]
  }
];

const categoryIcons = {
  food: Utensils,
  entertainment: Music,
  culture: Landmark
};

export default function Home() {
  const [location, setLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("food");
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationSearch = () => {
    if (location.trim()) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const handleUseGPS = () => {
    setIsLoading(true);
    // Simulate geolocation
    setTimeout(() => {
      setLocation("San Francisco, CA");
      setIsLoading(false);
    }, 1000);
  };

  const filteredSuggestions = mockSuggestions.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trekkie</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Location Search Section */}
        <Card className="mb-8 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Discover Your Next Adventure
            </CardTitle>
            <CardDescription>
              Enter a location to explore food, entertainment, and culture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter city, neighborhood, or address..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLocationSearch()}
                className="flex-1"
              />
              <Button onClick={handleLocationSearch} disabled={isLoading}>
                Search
              </Button>
              <Button onClick={handleUseGPS} variant="outline" disabled={isLoading}>
                <Navigation className="h-4 w-4 mr-2" />
                Use GPS
              </Button>
            </div>
            {location && (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                Exploring: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{location}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Tabs and Suggestions */}
        {location && (
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as Category)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="food" className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Food
              </TabsTrigger>
              <TabsTrigger value="entertainment" className="flex items-center gap-2">
                <Music className="h-4 w-4" />
                Entertainment
              </TabsTrigger>
              <TabsTrigger value="culture" className="flex items-center gap-2">
                <Landmark className="h-4 w-4" />
                Culture
              </TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-pulse text-gray-500">Finding great suggestions...</div>
              </div>
            ) : (
              <>
                <TabsContent value="food" className="mt-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSuggestions.map((suggestion) => (
                      <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="entertainment" className="mt-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSuggestions.map((suggestion) => (
                      <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="culture" className="mt-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredSuggestions.map((suggestion) => (
                      <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                    ))}
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        )}

        {/* Welcome State */}
        {!location && (
          <Card className="text-center py-12 shadow-lg">
            <CardContent>
              <MapPin className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Welcome to Trekkie!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Enter a location above to start discovering amazing food, entertainment, and cultural experiences.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Trekkie - Your personal guide to local discoveries</p>
        </div>
      </footer>
    </div>
  );
}

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const Icon = categoryIcons[suggestion.category];

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">{suggestion.name}</CardTitle>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {suggestion.rating}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-2 mt-2">
          <DollarSign className="h-4 w-4" />
          {suggestion.priceRange}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {suggestion.description}
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestion.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
