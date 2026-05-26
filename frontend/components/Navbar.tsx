"use client";

import { useState } from 'react';
import { Activity, ShieldCheck, User, LayoutDashboard, UploadCloud, FileText, Home, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false); // Mobile menu state

    const navLinks = [
        { name: 'Home', href: '/', icon: Home },
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Upload Dataset', href: '/upload', icon: UploadCloud },
        { name: 'Reports', href: '/report', icon: FileText },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full bg-surface border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Brand Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center space-x-2 mr-8">
                        <Activity className="h-8 w-8 text-primary" />
                        <span className="text-xl font-bold text-accent tracking-tight">MedSentinel</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex space-x-1 flex-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:text-accent hover:bg-surface-2'
                                        }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Desktop Right Side */}
                    <div className="hidden md:flex items-center space-x-6">
                        <div className="flex items-center space-x-1 text-success text-sm font-medium">
                            <ShieldCheck className="h-4 w-4" />
                            <span>HIPAA Vault Active</span>
                        </div>
                        <div className="h-9 w-9 rounded-full bg-surface-2 flex items-center justify-center border border-border cursor-pointer hover:bg-border transition-colors">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-muted hover:text-accent p-2">
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>

                </div>
            </div>

            {/* Mobile Navigation Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-surface border-b border-border px-2 pt-2 pb-4 space-y-1 shadow-xl">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-2 hover:text-accent'
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{link.name}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </nav>
    );
}