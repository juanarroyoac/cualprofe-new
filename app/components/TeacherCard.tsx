import Link from 'next/link';

interface Teacher {
  id: string;
  name: string;
  university: string;
  department: string;
  normalizedName: string;
}

interface TeacherCardProps {
  teacher: Teacher;
}

export default function TeacherCard({ teacher }: TeacherCardProps) {
  return (
    <Link href={`/teacher/${teacher.id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
        <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{teacher.university}</p>
        <p className="text-sm text-gray-500">{teacher.department}</p>
      </div>
    </Link>
  );
} 