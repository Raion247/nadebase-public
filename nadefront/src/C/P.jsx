import { useTheme } from '../C/TC';

export default function P() {
    const { theme } = useTheme();
    return (
        <div className={`min-h-screen text-gray-400 pt-20 pb-10 px-4 sm:px-8 ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
        <div className={`max-w-4xl mx-auto shadow-md rounded-2xl p-8 ${theme === 'light' ? 'bg-gray-800' : 'bg-[#1a1a2e]'}`}>
            <h1 className="text-3xl font-bold mb-6 text-white">Privacy Policy</h1>
            <p className="text-sm text-gray-400 mb-8">
            <strong>Last updated:</strong> May 14, 2026
            </p>

            <section className="space-y-6">
            <p>
                We operate <span className="text-orange-400">nadebase.com</span>. This policy explains what data we collect and how we use it.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2 text-white">Steam Sign-In</h2>
            <p>
                We use Steam to verify your identity and store a session cookie to keep you signed in. Steam provides public info like your username, avatar, and Steam ID — never your email or private details. We are not affiliated with Valve Corporation.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2 text-white">FACEIT & Demo Parsing</h2>
            <p>
            If you connect your FACEIT account, we store your FACEIT nickname and ID to sync match history. You can optionally upload demo files manually for parsing. Demo files are processed temporarily on our servers and deleted immediately after parsing — they are never stored. Parsed match statistics (grenade positions, accuracy, round data) are stored linked to your Steam ID and are retained until you delete your account.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2 text-white">Uploaded Images</h2>
            <p>
                Images are stripped of all EXIF metadata before storage. Your Steam ID and username are stored with each upload for moderation and ownership tracking. Your IP address is recorded at upload time to prevent abuse and is deleted once the upload is reviewed.
            </p>
            <p className="mt-4">
                Private uploads are only visible to you and are not reviewed by our moderation team. They are stored on our servers until you delete them or your account.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2 text-white">Payments</h2>
            <p>
            Payments are processed by <strong>Stripe</strong>. We don't receive or store your card or banking details. See Stripe's{" "}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Privacy Policy</a>.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2 text-white">Cookies & Analytics</h2>
            <p>
                We use a session cookie to keep you logged in. We collect basic anonymous analytics (browser type, device, page performance) to improve the site. None of this identifies you personally.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2 text-white">Your Data</h2>
            <p>
                All data is stored on secure servers. We never sell your data. You can delete your account anytime from your profile page. When you delete your account, your data is scheduled for permanent removal after 30 days — during this period you can recover your account by logging back in. After 30 days all associated data is permanently deleted. For data requests, email{" "}
                <a href="mailto:contact@nadebase.com" className="text-orange-400 underline">contact@nadebase.com</a>. We comply with GDPR rights including access, correction, deletion, and portability.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2 text-white">Third-Party Services</h2>
            <ul className="list-disc list-inside">
                <li><strong>Steam (Valve Corporation)</strong> – authentication. <a href="https://store.steampowered.com/privacy_agreement/" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Privacy Policy</a></li>
                <li><strong>FACEIT (Faceit Ltd)</strong> – match history and demo parsing. <a href="https://www.faceit.com/en/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Privacy Policy</a></li>
                <li><strong>Stripe</strong> – subscription payments. <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-400 underline">Privacy Policy</a></li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 mb-2 text-white">Changes</h2>
            <p>
                We may update this policy as the Service evolves. The latest version will always be on this page.
            </p>

            <h2 className="text-xl font-semibold mt-6 mb-2 text-white">Contact</h2>
            <p>
                <a href="mailto:contact@nadebase.com" className="text-orange-400 underline">contact@nadebase.com</a>
            </p>
            </section>
        </div>
        </div>
    );
}