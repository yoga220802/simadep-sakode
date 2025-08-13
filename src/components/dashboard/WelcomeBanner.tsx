interface WelcomeBannerProps {
	name: string;
}

export default function WelcomeBanner({ name }: WelcomeBannerProps) {
	return (
		<div className='bg-gradient-to-r from-primary to-orange-400 text-white p-6 rounded-xl shadow-md'>
			<h2 className='text-2xl font-bold'>Welcome back, {name}!</h2>
			<p className='mt-1'>Here's what's happening with your projects today.</p>
		</div>
	);
}
