import { Brain, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIProcessingLoaderProps {
  message?: string;
  className?: string;
}

export function AIProcessingLoader({ message = "AI is processing...", className }: AIProcessingLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 gap-4", className)}>
      <div className="relative">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="w-8 h-8 text-primary animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Sparkles className="w-5 h-5 text-primary animate-bounce" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-foreground">{message}</p>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
