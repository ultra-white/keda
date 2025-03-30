"use client";

import { useState, useEffect } from "react";
import { User, Trash2, CheckCircle, XCircle, Search } from "lucide-react";
import Button from "@/app/components/shared/Button";
import FilterSortPanel from "@/app/components/admin/FilterSortPanel";
import { sortItems, parseSortString, generateSortOptions } from "@/app/lib/admin/sortUtils";

interface UserType {
	id: string;
	name: string | null;
	email: string;
	role: string;
	createdAt: string;
}

export default function UsersPage() {
	const [users, setUsers] = useState<UserType[]>([]);
	const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [sortOrder, setSortOrder] = useState("");

	useEffect(() => {
		fetchUsers();
	}, []);

	useEffect(() => {
		if (users) {
			let filtered = users;

			// Фильтрация пользователей при изменении поисковой строки
			if (searchTerm) {
				filtered = users.filter((user) => {
					const userName = user.name || "";
					return (
						userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
						user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
						user.role.toLowerCase().includes(searchTerm.toLowerCase())
					);
				});
			}

			// Сортировка пользователей
			if (sortOrder) {
				const [sortKey, sortDirection] = parseSortString(sortOrder);
				if (sortKey) {
					filtered = sortItems(filtered, sortKey, sortDirection);
				}
			}

			setFilteredUsers(filtered);
		}
	}, [searchTerm, sortOrder, users]);

	const fetchUsers = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/admin/users");
			if (!response.ok) {
				throw new Error("Не удалось загрузить пользователей");
			}
			const data = await response.json();
			setUsers(data);
			setFilteredUsers(data);
		} catch (err) {
			console.error("Ошибка при загрузке пользователей:", err);
			setError(err instanceof Error ? err.message : "Произошла ошибка");
		} finally {
			setIsLoading(false);
		}
	};

	const toggleAdminStatus = async (userId: string, currentRole: string) => {
		try {
			const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ role: newRole }),
			});

			if (!response.ok) {
				throw new Error("Не удалось обновить статус пользователя");
			}

			// Обновляем список пользователей
			setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)));
		} catch (err) {
			console.error("Ошибка при обновлении статуса:", err);
			alert(err instanceof Error ? err.message : "Произошла ошибка");
		}
	};

	const deleteUser = async (userId: string) => {
		if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) {
			return;
		}

		try {
			const response = await fetch(`/api/admin/users/${userId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Не удалось удалить пользователя");
			}

			// Обновляем список пользователей
			setUsers(users.filter((user) => user.id !== userId));
		} catch (err) {
			console.error("Ошибка при удалении пользователя:", err);
			alert(err instanceof Error ? err.message : "Произошла ошибка");
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return new Intl.DateTimeFormat("ru-RU", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(date);
	};

	// Обработчики для компонента FilterSortPanel
	const handleSearch = (term: string) => {
		setSearchTerm(term);
	};

	const handleSortChange = (sort: string) => {
		setSortOrder(sort);
	};

	// Опции сортировки
	const sortOptions = generateSortOptions([
		{ key: "name", label: "Имя" },
		{ key: "email", label: "Email" },
		{ key: "role", label: "Роль" },
		{ key: "createdAt", label: "Дата регистрации" },
	]);

	if (isLoading) {
		return (
			<div className='flex justify-center items-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900'></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='bg-red-100 p-4 rounded-md'>
				<p className='text-red-700'>{error}</p>
				<button onClick={() => window.location.reload()} className='mt-2 bg-red-600 text-white px-4 py-2 rounded-md'>
					Попробовать снова
				</button>
			</div>
		);
	}

	return (
		<div>
			<h1 className='text-2xl font-bold mb-6'>Управление пользователями</h1>

			{/* Использование компонента FilterSortPanel */}
			<FilterSortPanel
				onSearch={handleSearch}
				onSortChange={handleSortChange}
				searchPlaceholder='Поиск по имени, email или роли'
				sortOptions={sortOptions}
				initialSearchTerm={searchTerm}
				initialSortValue={sortOrder}
				totalItems={filteredUsers.length}
				itemsLabel='Всего пользователей'
				icon={<User className='h-4 w-4' />}
				showSort={true}
				showFilter={false}
				showTotalItems={true}
			/>

			<div className='bg-white rounded-md shadow overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='min-w-full divide-y divide-gray-200'>
						<thead className='bg-gray-50'>
							<tr>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>ID</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Имя</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Email
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Роль</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Дата регистрации
								</th>
								<th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
									Действия
								</th>
							</tr>
						</thead>
						<tbody className='bg-white divide-y divide-gray-200'>
							{filteredUsers.length > 0 ? (
								filteredUsers.map((user) => (
									<tr key={user.id} className='hover:bg-gray-50'>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{user.id.substring(0, 8)}...</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='text-sm font-medium text-gray-900'>{user.name || "Нет имени"}</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<div className='text-sm text-gray-500'>{user.email}</div>
										</td>
										<td className='px-6 py-4 whitespace-nowrap'>
											<Button
												variant={user.role === "ADMIN" ? "danger" : "primary"}
												size='sm'
												onClick={() => toggleAdminStatus(user.id, user.role)}
											>
												{user.role === "ADMIN" ? (
													<XCircle className='mr-1 h-3 w-3' />
												) : (
													<CheckCircle className='mr-1 h-3 w-3' />
												)}
												{user.role === "ADMIN" ? "Снять админа" : "Сделать админом"}
											</Button>
										</td>
										<td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{formatDate(user.createdAt)}</td>
										<td className='px-6 py-4 whitespace-nowrap text-left text-sm font-medium'>
											<div className='flex space-x-3'>
												<Button variant='danger' size='sm' onClick={() => deleteUser(user.id)}>
													<Trash2 className='h-3 w-3 mr-1' />
													Удалить
												</Button>
											</div>
										</td>
									</tr>
								))
							) : (
								<tr>
									<td colSpan={6} className='px-6 py-4 text-center text-sm text-gray-500'>
										Пользователи не найдены
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
