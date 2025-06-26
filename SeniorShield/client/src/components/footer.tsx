import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <Shield className="text-blue-400 h-8 w-8 mr-3" />
              <span className="text-2xl font-bold text-white">Nuvanta</span>
            </div>
            <p className="text-gray-300">Advanced financial protection for seniors, powered by AI and machine learning.</p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <div className="space-y-2 text-gray-300">
              <p>📞 1-800-NUVANTA</p>
              <p>✉️ support@nuvanta.com</p>
              <p>🕒 24/7 Emergency Support</p>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Security</h4>
            <div className="space-y-2 text-gray-300">
              <p>🔒 Bank-level encryption</p>
              <p>🛡️ FDIC member institutions</p>
              <p>✅ SOC 2 Type II certified</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">© 2024 Nuvanta. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}
