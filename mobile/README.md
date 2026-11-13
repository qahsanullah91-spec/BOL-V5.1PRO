# Sky Ariana BOL — Mobile Companion Application

This Flutter companion application connects to the Sky Ariana BOL server to query shipment waybills, view live cargo records, and monitor logistics status.

---

## 1. Network Architecture

The app uses `package:http` with Flutter background isolate parsing via `compute()` to maintain 60fps scrolling on low-end devices:

| Environment | Base URL |
|---|---|
| **Android Emulator** | `http://10.0.2.2:3001/api` |
| **iOS Simulator** | `http://localhost:3001/api` |
| **Physical Device (LAN)** | `http://<YOUR_LAN_IP>:3001/api` |
| **Cloud Production (GCP)** | `https://<CLOUD_RUN_URL>/api` |

---

## 2. Running the App

Ensure Flutter SDK is installed and Sky Ariana BOL Server is running on port 3001:

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Get dependencies
flutter pub get

# 3. Launch on connected device or emulator
flutter run
```

---

## 3. Key Modules

- **Model (`lib/models/bol_record.dart`)**: Strongly-typed model with `fromJson` and `cleanSummary`.
- **API Service (`lib/services/bol_api_service.dart`)**: Dynamic platform routing, status checks, background isolate parsing with `compute()`.
- **UI View (`lib/screens/bol_list_view.dart`)**: `FutureBuilder`, live health indicator pill, pull-to-refresh (`RefreshIndicator`), and server-side pagination.
