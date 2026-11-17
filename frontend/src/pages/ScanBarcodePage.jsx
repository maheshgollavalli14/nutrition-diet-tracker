import { useNavigate } from 'react-router-dom';
import BarcodeScannerPanel from '../components/BarcodeScannerPanel';

export default function ScanBarcodePage() {
  const navigate = useNavigate();

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <h1 className="page-title">Scan Packaged Food Barcode</h1>
          <p className="page-subtitle">
            Scan with your webcam or enter a UPC/EAN code to look up local or Open Food Facts nutrition data.
          </p>
        </div>
      </div>

      <BarcodeScannerPanel onLogged={() => navigate('/dashboard')} />
    </div>
  );
}
