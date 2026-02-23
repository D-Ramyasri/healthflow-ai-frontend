import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <h1 className="text-8xl font-bold text-primary/20 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">The page you're looking for doesn't exist.</p>
        <Button asChild><Link to="/"><Home className="w-4 h-4 mr-2" />Home</Link></Button>
      </div>
    </div>
  );
};

export default NotFound;
