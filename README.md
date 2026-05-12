# 🌍 G-EcoQuest

G-EcoQuest is a gamified, community-driven environmental cleanup mobile application. Users can drop pins on polluted areas (quests), crowd-fund bounties, and claim rewards by physically going to the location, cleaning it up, and verifying the result via a live camera snap.

Currently focused on **Naga City, Philippines**.

## ✨ Features
- **Interactive Map:** View active cleanup bounties (red pins) and completed quests (gray pins) locally in Naga City.
- **Quest Details & Crowdfunding:** View details about a reported area, including its estimated size and attached GPS coordinates. Users can "Boost" the reward bounty with a simulated tip.
- **Verify Cleanups (Camera):** Gamified workflow where "Questers" use their phone camera to take an "After" photo verifying the location is clean.
- **Active Quests Feed:** A scrollable list of nearby active cleanup points with their reward tiers.
- **Leaderboard:** Earn Eco-Points for completing quests and rank up against other community members.
- **Dynamic Theming:** Seamless native Light Mode / Dark Mode toggles that reskin the UI and the Map style.

## 🛠️ Tech Stack
- **Framework:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Navigation:** React Navigation (Bottom Tabs & Native Stack)
- **Maps:** `react-native-maps`
- **Hardware APIs:** `expo-camera`, `expo-location`
- **Icons & Fonts:** `lucide-react-native`, Google Fonts (`@expo-google-fonts/inter`)

## 🚀 How to Run Locally

1. **Install Dependencies**
   Navigate into the app directory and install modules:
   ```bash
   cd G-EcoQuestApp
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npx expo start --clear
   ```

3. **Open on your Phone**
   - Download the **Expo Go** app from the iOS App Store or Google Play.
   - Connect your phone to the same Wi-Fi network as your computer.
   - **Android:** Scan the QR code in the terminal using the Expo Go app.
   - **iOS:** Scan the QR code using your regular iPhone Camera app and click the prompt.

## 📂 Project Structure
Currently operating as a monolith prototype in `G-EcoQuestApp/App.js` using Context API for state and theming. 

---
*Built with ❤️ for a cleaner planet.*