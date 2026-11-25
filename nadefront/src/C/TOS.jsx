import { Link } from "react-router-dom";
import { useTheme } from '../C/TC';

export default function TOS() {
    const { theme } = useTheme();
    return (
        <div className={`min-h-screen text-gray-400 pt-20 pb-10 px-4 sm:px-8 ${theme === 'light' ? 'bg-gray-900' : 'bg-[#0e0e1a]'}`}>
        <div className={`max-w-4xl mx-auto shadow-md rounded-2xl p-8 ${theme === 'light' ? 'bg-gray-800' : 'bg-[#1a1a2e]'}`}>
            <h1 className="text-3xl font-bold mb-6 text-white">Terms of Service</h1>
            <p className="text-sm text-gray-400 mb-8">
            <strong>Last updated:</strong> May 14, 2026
            </p>

            <section className="space-y-6">
                <p>
                    By using <span className="text-orange-400">nadebase.com</span> ("Service"), you agree to these Terms. If you don't agree, please don't use the Service.
                </p>

                <h2 className="text-xl font-semibold text-white">1. Accounts</h2>
                <p>
                    You need a valid Steam account to use Nadebase. We are not affiliated with Valve Corporation or FACEIT Ltd. You're responsible for your account activity. We may suspend or terminate accounts that misuse the Service.
                </p>

                <h2 className="text-xl font-semibold text-white">2. Uploads</h2>
                <p>
                You can upload Counter-Strike 2 lineup images. You keep ownership of what you upload.
                </p>
                <p className="mt-4">
                <strong>Public uploads</strong> are reviewed before going public — anything off-topic or inappropriate will be rejected and deleted. By submitting a public upload, you grant us a license to host and display your content to operate the Service. Your Steam username is shown publicly under your uploads unless you choose to post anonymously during submission. Anonymous settings can't be changed after submission.
                </p>
                <p className="mt-4">
                <strong>Private uploads</strong> are only visible to you and are not reviewed by us. They are stored on our servers and can be deleted at any time from your account.
                </p>

                <h2 className="text-xl font-semibold text-white">3. FACEIT & Demo Parsing</h2>
                <p>
                    You can optionally connect your FACEIT account to import match history and parse demo files. Demo files are processed temporarily and deleted immediately after parsing. Parsed statistics are stored linked to your Steam account.
                </p>

                <h2 className="text-xl font-semibold text-white">4. Prohibited Use</h2>
                <p>You may not:</p>
                <ul className="list-disc list-inside">
                    <li>Upload illegal, harmful, or abusive content</li>
                    <li>Attempt to hack, overload, or disrupt the Service</li>
                    <li>Impersonate others or misuse Steam authentication</li>
                    <li>Use the site for spam or automated data collection</li>
                </ul>

                <h2 className="text-xl font-semibold text-white">5. Payments</h2>
                <p>
                    Some features require a paid subscription processed by <strong>Stripe</strong>. We don't store your card or banking details. You can cancel anytime from your account settings — you'll keep access until the end of your billing cycle. Refunds may be issued if you were charged after cancelling or didn't receive access due to a verified technical issue.
                </p>

                <h2 className="text-xl font-semibold text-white">6. Limitation of Liability</h2>
                <p>
                    The Service is provided "as is" without warranties. We're not liable for damages resulting from your use of the Service, to the maximum extent permitted by law.
                </p>

                <h2 className="text-xl font-semibold text-white">7. Changes & Discontinuation</h2>
                <p>
                We may update these Terms from time to time. The Service may be modified, suspended, or shut down at any time. If the Service is to be permanently shut down, we'll try to give at least 30 days notice on this page. We're not liable for any downtime or interruptions.
                </p>

                <h2 className="text-xl font-semibold text-white">8. Contact</h2>
                <p>
                    For any inquiries email us at{" "}
                    <a href="mailto:contact@nadebase.com" className="text-orange-400 underline">contact@nadebase.com</a>.
                </p>
            </section>
        </div>
        </div>
    );
}