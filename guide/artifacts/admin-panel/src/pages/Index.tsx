import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6">
          <Plane className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">YCOS</h1>
        <p className="text-muted-foreground mb-8">Youth Camping & Travel Operating System</p>
        <Button size="lg" onClick={() => navigate("/admin/login")}>
          Go to Admin Panel
        </Button>
      </div>
    </div>
  );
};

export default Index;
