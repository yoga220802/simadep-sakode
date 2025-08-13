"use client";

import { useAuth } from "@/src/context/AuthContext";
import AdminDashboard from "@/src/components/dashboard/role-specific/AdminDashboard";
import ProjectManagerDashboard from "@/src/components/dashboard/role-specific/ProjectManagerDashboard";
import TeamMemberDashboard from "@/src/components/dashboard/role-specific/TeamMemberDashboard";
import WelcomeBanner from "@/src/components/dashboard/WelcomeBanner";

export default function DashboardPage() {
	const { user } = useAuth();

	const renderDashboardByRole = () => {
		switch (user?.role) {
			case "Admin":
				return <AdminDashboard />;
			case "Project Manager":
				return <ProjectManagerDashboard />;
			case "Team Member":
				return <TeamMemberDashboard />;
			default:
				// Tampilan default atau loading jika user belum terdefinisi
				return <p>Loading user data...</p>;
		}
	};

	if (!user) {
		return null;
	}

	return (
		<div className='space-y-6'>
			<WelcomeBanner name={user.name} />
			{renderDashboardByRole()}
		</div>
	);
}
