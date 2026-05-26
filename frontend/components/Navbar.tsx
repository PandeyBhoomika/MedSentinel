import { Activity, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full bg-surface border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Left Side: Brand Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center space-x-2">
                        <Activity className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold text-accent tracking-tight">MedSentinel</span>
                        <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium border border-primary/20">
                            AI V.1
                        </span>
                    </Link>

                    {/* Right Side: Status and User */}
                    <div className="flex items-center space-x-6">
                        <div className="hidden md:flex items-center space-x-1 text-success text-sm font-medium">
                            <ShieldCheck className="h-4 w-4" />
                            <span>HIPAA Vault Active</span>
                        </div>

                        {/* User Avatar Placeholder */}
                        <div className="h-9 w-9 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/30 cursor-pointer hover:bg-secondary/30 transition-colors">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                    </div>

                </div>
            </div>
        </nav>
    );
}