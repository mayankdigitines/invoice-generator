import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '../components/ui/card';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError('');

    let result;
    if (isRegistering) {
      result = await register(email, password);
    } else {
      result = await login(email, password);
    }

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/20 relative overflow-hidden text-foreground">
      <Card className="w-full max-w-sm border-border bg-card shadow-lg">
        <CardHeader className="space-y-2 pb-4 text-center">
          <div className="mx-auto w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight">
              {isRegistering ? 'Register' : 'Login'}
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              {isRegistering
                ? 'Create a new account'
                : 'Sign in to access dashboard'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-9"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-9"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md font-medium text-center animate-in fade-in slide-in-from-top-1">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-9 text-sm font-semibold transition-all"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  {isRegistering ? 'Creating...' : 'Signing In...'}
                </>
              ) : isRegistering ? (
                'Create Account'
              ) : (
                'Login'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-center pb-6 pt-0">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
                setError('');
                setIsRegistering(!isRegistering);
            }}
          >
            {isRegistering
              ? 'Back to Login'
              : 'Create Account'}
          </Button>
        </CardFooter>
      </Card>

      <div className="absolute bottom-4 text-center text-[10px] text-muted-foreground/60">
        &copy; {new Date().getFullYear()} Invoice Generator. All rights reserved.
      </div>
    </div>
  );
}
