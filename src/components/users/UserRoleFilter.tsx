"use client";

import {
	Dropdown,
	DropdownTrigger,
	Button,
	DropdownMenu,
	DropdownItem,
} from "@heroui/react";
import { ChevronDown } from "lucide-react";
import type { Role } from "@/src/types/auth";
import type { Selection } from "@react-types/shared";

interface UserRoleFilterProps {
	selectedRole: Selection;
	onRoleChange: (keys: Selection) => void;
	roleOptions: (Role | "Semua")[];
}

export default function UserRoleFilter({
	selectedRole,
	onRoleChange,
	roleOptions,
}: UserRoleFilterProps) {
	const selectedRoleValue = Array.from(selectedRole)[0] || "Semua";

	return (
		<Dropdown>
			<DropdownTrigger>
				<Button
					variant='bordered'
					className='capitalize'
					endContent={<ChevronDown size={16} />}>
					{selectedRoleValue}
				</Button>
			</DropdownTrigger>
			<DropdownMenu
				aria-label='Filter berdasarkan Role'
				variant='flat'
				disallowEmptySelection
				selectionMode='single'
				selectedKeys={selectedRole}
				onSelectionChange={onRoleChange}>
				{roleOptions.map((role) => (
					<DropdownItem key={role}>{role}</DropdownItem>
				))}
			</DropdownMenu>
		</Dropdown>
	);
}
