"use client";

import { useEffect, useState } from "react";
import { adminDashboardService } from "@/src/services/adminDashboardService";
import type { StatCardData } from "@/src/types/dashboard";
import type { Employee, Client } from "@/src/types/adminDashboard";

import StatCard from "../StatCard";
import EmployeeTable from "../EmployeeTable";
import ClientTable from "../ClientTable";

export default function AdminDashboard() {
	const [statCards, setStatCards] = useState<StatCardData[]>([]);
	const [employees, setEmployees] = useState<Employee[]>([]);
	const [clients, setClients] = useState<Client[]>([]);

	useEffect(() => {
		setStatCards(adminDashboardService.getAdminStatCards());
		setEmployees(adminDashboardService.getEmployees());
		setClients(adminDashboardService.getClients());
	}, []);

	return (
		<div className='space-y-8'>
			{/* Kartu Statistik */}
			<div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
				{statCards.map((card) => (
					// Memanggil StatCard dengan varian "admin"
					<StatCard key={card.title} data={card} variant='admin' />
				))}
			</div>

			{/* Tabel Pegawai */}
			<EmployeeTable employees={employees} />

			{/* Tabel Client */}
			<ClientTable clients={clients} />
		</div>
	);
}
