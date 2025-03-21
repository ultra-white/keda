/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "images.unsplash.com",
			},
			{
				protocol: "https",
				hostname: "unsplash.com",
			},
			{
				protocol: "https",
				hostname: "via.placeholder.com",
			},
			{
				protocol: "https",
				hostname: "placehold.co",
			},
			{
				protocol: "https",
				hostname: "basket-17.wbbasket.ru",
			},
			{
				protocol: "https",
				hostname: "basket-15.wbbasket.ru",
			},
			{
				protocol: "https",
				hostname: "i.postimg.cc",
			},
			{
				protocol: "https",
				hostname: "basket-12.wbbasket.ru",
			},
			{
				protocol: "https",
				hostname: "basket-12.wbbasket.ru",
			},
		],
	},
};

module.exports = nextConfig;
