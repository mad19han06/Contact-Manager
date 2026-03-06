import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { BookUser, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 animate-fade-in max-w-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-elevated">
          <BookUser className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-heading font-bold tracking-tight">
          Contact Manager
        </h1>
        <p className="text-lg text-muted-foreground">
          Securely store and manage your personal contacts with a clean, modern interface.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link to="/register">
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
