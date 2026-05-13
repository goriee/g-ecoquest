import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ScrollView, Image, ActivityIndicator, Alert, Switch, TextInput } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFonts, Inter_400Regular, Inter_700Bold, Inter_900Black } from '@expo-google-fonts/inter';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MapPin, List, Plus, Trophy, User, Bell, Navigation, CheckCircle, Camera, Award, Shield, Settings, Moon, Sun, Heart, DollarSign, Store } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const { width, height } = Dimensions.get('window');

// --- THEME CONTEXT & COLORS ---
const lightColors = {
  bgBase: '#F8FAFC', bgCard: '#FFFFFF', textMain: '#1E293B', textMuted: '#64748B',
  primary: '#2563EB', primaryLight: '#DBEAFE', success: '#22C55E', warning: '#F59E0B', danger: '#EF4444', border: '#E2E8F0',
  mapStyle: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] }
  ]
};

const darkColors = {
  bgBase: '#0F172A', bgCard: '#1E293B', textMain: '#F8FAFC', textMuted: '#94A3B8',
  primary: '#3B82F6', primaryLight: '#1E3A8A', success: '#22C55E', warning: '#F59E0B', danger: '#EF4444', border: '#334155',
  mapStyle: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  ]
};

const ThemeContext = createContext();

const getSizeColor = (size, fallback) => {
  switch (size) {
    case 'Hazardous': return '#DC2626'; // Red
    case 'Large': return '#F97316';     // Orange
    case 'Medium': return '#F59E0B';    // Yellow
    case 'Small': return '#3B82F6';     // Blue
    default: return fallback;
  }
};

// --- MOCK DATA (Naga City, PH) ---
const INITIAL_QUESTS = [
  { id: 1, lat: 13.6245, lon: 123.1850, address: 'Plaza Quince Martires, Centro', title: 'Plaza Quince Martires Litter', desc: 'Lots of scattered plastic wrappers and cups near the monument benches.', size: 'Large', pts: 350, reward: 200, status: 'active', photoUri: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=400&auto=format&fit=crop' },
  { id: 2, lat: 13.6220, lon: 123.1830, address: 'Naga Public Market, General Luna', title: 'Naga Public Market Cleanup', desc: 'Severe blockage of drainage with hazardous bio-waste and plastics.', size: 'Hazardous', pts: 480, reward: 500, status: 'active', photoUri: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?q=80&w=400&auto=format&fit=crop' },
  { id: 3, lat: 13.6260, lon: 123.1880, address: 'Bicol River Bank, Tabuco', title: 'Bicol River Bank Plastics', desc: 'A few plastic bottles washed up on the river bank.', size: 'Small', pts: 80, reward: 50, status: 'active', photoUri: null },
];

const PARTNER_STORES = [
  { id: 101, lat: 13.6250, lon: 123.1870, title: 'Eco Café Naga', desc: 'Partner Store! Exchange your Eco-Points for delicious coffee, pastries, and sustainable goods right here in the city.', offers: ['500 pts = Free Iced Coffee', '800 pts = Bamboo Straw Set', '1500 pts = Reusable Tote Bag'] }
];

const TOP_CLEANERS = [
  { id: 1, name: 'Juan Dela Cruz', pts: 3450, rank: 1, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100' },
  { id: 2, name: 'Maria Santos', pts: 2890, rank: 2, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100' },
  { id: 3, name: 'Jose Rizal', pts: 2100, rank: 3, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100' },
];

const TOP_SCOUTS = [
  { id: 4, name: 'Andres Bonifacio', pts: 1850, rank: 1, avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=100' },
  { id: 5, name: 'Gabriela Silang', pts: 1420, rank: 2, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100' },
  { id: 6, name: 'Lapu-Lapu', pts: 950, rank: 3, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100' },
];

// --- SCREENS ---
function MapScreen({ navigation, route }) {
  const { colors } = useContext(ThemeContext);
  const [bounties, setBounties] = useState(INITIAL_QUESTS);

  useEffect(() => {
    if (route.params?.updatedBounty) {
      setBounties(prev => prev.map(b => b.id === route.params.updatedBounty.id ? route.params.updatedBounty : b));
      navigation.setParams({ updatedBounty: null });
    }
  }, [route.params]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <MapView 
        style={styles.map} 
        customMapStyle={colors.mapStyle}
        showsPointsOfInterest={false}
        // Center on Naga City, PH
        initialRegion={{ latitude: 13.621775, longitude: 123.185495, latitudeDelta: 0.015, longitudeDelta: 0.015 }}
      >
        {bounties.map(q => (
          <Marker key={q.id} coordinate={{ latitude: q.lat, longitude: q.lon }} onPress={() => navigation.navigate('QuestDetails', { bounty: q })}>
             <View style={[styles.pin, { backgroundColor: q.status === 'completed' ? colors.textMuted : getSizeColor(q.size, colors.danger), borderColor: colors.bgCard }]}>
                {q.status === 'completed' ? <CheckCircle color="#FFF" size={16} /> : <MapPin color="#FFF" size={16} />}
             </View>
          </Marker>
        ))}
        {PARTNER_STORES.map(store => (
          <Marker key={store.id} coordinate={{ latitude: store.lat, longitude: store.lon }} onPress={() => navigation.navigate('StoreDetails', { store })}>
             <View style={[styles.pin, { backgroundColor: colors.success, borderColor: colors.bgCard, width: 36, height: 36, borderRadius: 18 }]}>
                <Store color="#FFF" size={18} />
             </View>
          </Marker>
        ))}
      </MapView>

      <View style={[styles.headerFloating, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.h1, { color: colors.textMain }]}>G-EcoQuest</Text>
          <Text style={[styles.p, { color: colors.textMuted }]}>Naga City, PH</Text>
        </View>
        <TouchableOpacity style={[styles.bellBox, { backgroundColor: colors.primaryLight }]}>
          <Bell color={colors.primary} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function QuestsScreen({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const [filter, setFilter] = useState('All');
  
  const filteredQuests = filter === 'All' ? INITIAL_QUESTS : INITIAL_QUESTS.filter(q => q.size === filter);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <View style={[styles.appHeader, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.h1, { color: colors.textMain }]}>Active Quests</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {['All', 'Small', 'Medium', 'Large', 'Hazardous'].map(f => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: filter === f ? colors.primary : colors.primaryLight, marginRight: 8 }}>
              <Text style={{ fontFamily: 'Inter_700Bold', color: filter === f ? '#FFF' : colors.primary }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {filteredQuests.map(q => (
          <View key={q.id} style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
               <Text style={[styles.h2, { color: colors.textMain, flex: 1 }]}>{q.title}</Text>
               <View style={[styles.tag, { backgroundColor: colors.primaryLight }]}><Text style={[styles.tagText, { color: colors.primary }]}>₱{q.reward}</Text></View>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
               <View style={[styles.tag, { backgroundColor: getSizeColor(q.size, colors.primary) + '20', marginRight: 12 }]}>
                 <Text style={[styles.tagText, { color: getSizeColor(q.size, colors.primary) }]}>{q.size}</Text>
               </View>
               <MapPin size={14} color={colors.textMuted} style={{marginRight: 4}}/>
               <Text style={[styles.p, { color: colors.textMuted }]}>+{q.pts} pts</Text>
            </View>
            <TouchableOpacity style={[styles.btn, { backgroundColor: colors.success }]} onPress={() => navigation.navigate('QuestDetails', { bounty: q })}>
               <CheckCircle color="#FFF" size={18} />
               <Text style={styles.btnText}>View Quest</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// -------------------------------------------------------------
// QUEST DETAILS & COMPLETION FLOW
// -------------------------------------------------------------
function QuestDetailsScreen({ navigation, route }) {
  const { colors, isDark } = useContext(ThemeContext);
  const [bounty, setBounty] = useState(route.params.bounty);

  const handleTip = () => {
    Alert.alert(
      "Fund this Quest",
      "Add ₱50 to the bounty to incentivize cleanup?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Add ₱50", 
          onPress: () => {
            const updated = { ...bounty, reward: bounty.reward + 50 };
            setBounty(updated);
            Alert.alert("Success", "₱50 added. The new bounty is ₱" + updated.reward);
            // Updating the map params behind the scenes
            navigation.navigate('MainTabs', { screen: 'Map', params: { updatedBounty: updated } });
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgBase }]} contentContainerStyle={{ paddingBottom: 40 }}>
      {bounty.photoUri ? (
        <Image source={{ uri: bounty.photoUri }} style={{ width: '100%', height: 280 }} />
      ) : (
        <View style={{ width: '100%', height: 280, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
          <Camera size={48} color={colors.textMuted} />
        </View>
      )}

      <View style={{ padding: 24 }}>
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 12}}>
          <View style={[styles.tag, { backgroundColor: getSizeColor(bounty.size, colors.primary) + '20' }]}>
             <Text style={[styles.tagText, { color: getSizeColor(bounty.size, colors.primary) }]}>{bounty.size} Hazard Level</Text>
          </View>
        </View>
        <Text style={[styles.h1, { color: colors.textMain, marginBottom: 8 }]}>{bounty.title}</Text>
        <Text style={[styles.p, { color: colors.textMuted, marginBottom: 16 }]}>{bounty.desc || "No description provided."}</Text>
        
        <View style={[{ flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, backgroundColor: colors.primaryLight, marginBottom: 16 }]}>
           <DollarSign size={24} color={colors.primary} />
           <View style={{marginLeft: 12}}>
             <Text style={[styles.p, { color: colors.textMain, opacity: 0.8 }]}>Current Bounty</Text>
             <Text style={[styles.h1, { color: colors.primary }]}>₱{bounty.reward}</Text>
           </View>
        </View>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: isDark ? colors.bgCard : '#E2E8F0', borderWidth: 1, borderColor: colors.border, marginBottom: 24 }]} 
          onPress={handleTip}
        >
          <Heart color={colors.danger} size={20} />
          <Text style={[styles.btnText, { color: colors.textMain }]}> Boost Reward (+₱50)</Text>
        </TouchableOpacity>

        <Text style={[styles.h2, { color: colors.textMain, marginBottom: 12 }]}>Location</Text>
        <View style={[styles.locationBanner, { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border }]}>
           <Navigation color={colors.primary} size={20} />
           <Text style={[styles.locationText, { color: colors.textMain, flex: 1 }]} numberOfLines={2}>{bounty.address || `${bounty.lat.toFixed(5)}, ${bounty.lon.toFixed(5)}`}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: colors.success, marginTop: 16 }]}
          onPress={() => navigation.navigate('CompleteQuest', { bounty })}
        >
          <CheckCircle color="#FFF" size={24} />
          <Text style={styles.btnText}>Accept & Clean Up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function CompleteQuestScreen({ navigation, route }) {
  const { colors } = useContext(ThemeContext);
  const { bounty } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraRef = useRef(null);

  if (!permission?.granted) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bgBase }]}>
         <Text style={[styles.p, { color: colors.textMain, marginBottom: 16 }]}>Camera needed to verify cleanup.</Text>
         <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={requestPermission}><Text style={styles.btnText}>Grant Permission</Text></TouchableOpacity>
      </View>
    );
  }

  const submitCompletion = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const updated = { ...bounty, status: 'verifying' };
      Alert.alert('Verification Pending', `Your photo has been uploaded! Peers will verify your cleanup before releasing ₱${bounty.reward} and ${bounty.pts} Eco-Points.`, [
        { text: 'Back to Map', onPress: () => navigation.navigate('MainTabs', { screen: 'Map', params: { updatedBounty: updated } }) }
      ]);
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase, padding: 24 }]}>
      <Text style={[styles.h1, { color: colors.textMain, marginBottom: 8 }]}>Verify Cleanup</Text>
      <Text style={[styles.p, { color: colors.textMuted, marginBottom: 20 }]}>Take an "After" photo. Peers will review it to release funds.</Text>
      
      {!photo ? (
         <View style={styles.cameraBox}>
           <CameraView style={styles.camera} facing="back" ref={cameraRef}>
             <View style={styles.cameraFooter}>
                <TouchableOpacity style={styles.shutterBtn} onPress={async () => setPhoto((await cameraRef.current.takePictureAsync()).uri)}>
                  <View style={styles.shutterIn} />
                </TouchableOpacity>
             </View>
           </CameraView>
         </View>
      ) : (
         <View style={styles.cameraBox}>
           <Image source={{ uri: photo }} style={styles.camera} />
           <TouchableOpacity style={{ position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 20 }} onPress={() => setPhoto(null)}>
             <Text style={{color: '#FFF', fontFamily: 'Inter_700Bold'}}>Retake Photo</Text>
           </TouchableOpacity>
         </View>
      )}

      <TouchableOpacity 
        style={[styles.btn, { backgroundColor: colors.success }, (!photo || isSubmitting) && { opacity: 0.6 }]} 
        disabled={!photo || isSubmitting} onPress={submitCompletion}
      >
        {isSubmitting ? <ActivityIndicator color="#FFF" /> : (
          <><Award color="#FFF" size={24} /><Text style={styles.btnText}>Claim Bounty</Text></>
        )}
      </TouchableOpacity>
    </View>
  );
}

// -------------------------------------------------------------
// PARTNER STORE SCREEN
// -------------------------------------------------------------
function StoreDetailsScreen({ route }) {
  const { colors } = useContext(ThemeContext);
  const { store } = route.params;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgBase }]} contentContainerStyle={{ padding: 24 }}>
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border, alignItems: 'center' }]}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
           <Store color={colors.success} size={40} />
        </View>
        <Text style={[styles.h1, { color: colors.textMain, textAlign: 'center' }]}>{store.title}</Text>
        <Text style={[styles.p, { color: colors.textMuted, textAlign: 'center', marginTop: 8 }]}>{store.desc}</Text>
      </View>
      
      <Text style={[styles.h2, { color: colors.textMain, marginTop: 24, marginBottom: 16 }]}>Redeemable Rewards</Text>
      {store.offers.map((offer, i) => (
         <View key={i} style={[styles.settingRow, { backgroundColor: colors.bgCard, borderBottomColor: colors.border, borderRadius: 12, marginBottom: 8, paddingHorizontal: 16 }]}>
            <Text style={[styles.p, { color: colors.textMain, flex: 1, fontFamily: 'Inter_700Bold' }]}>{offer}</Text>
            <Award color={colors.primary} size={24} />
         </View>
      ))}
    </ScrollView>
  );
}

// -------------------------------------------------------------
// EXISTING TABS
// -------------------------------------------------------------
function ReportScreen({ navigation }) {
  const { colors } = useContext(ThemeContext);
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [size, setSize] = useState('Medium');
  const [reward, setReward] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cameraRef = useRef(null);

  if (!permission?.granted) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.bgBase }]}>
        <Text style={[styles.p, { color: colors.textMain, marginBottom: 16 }]}>Camera permission required to drop pins.</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={requestPermission}><Text style={styles.btnText}>Grant Permission</Text></TouchableOpacity>
      </View>
    );
  }

  const submitReport = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Pin Dropped!', `Your ${size} report has been added to the map.`, [
        { text: 'Sweet!', onPress: () => {
            setPhoto(null);
            setReward('');
            navigation.navigate('MainTabs', { screen: 'Map' });
        } }
      ]);
    }, 1500);
  };

  const SIZES = ['Small', 'Medium', 'Large', 'Hazardous'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <View style={[styles.appHeader, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.h1, { color: colors.textMain }]}>Drop a Pin</Text>
      </View>
      <View style={{ padding: 20 }}>
        <Text style={[styles.h2, { color: colors.textMain, marginBottom: 8 }]}>Capture the Mess</Text>
        <Text style={[styles.p, { color: colors.textMuted, marginBottom: 20 }]}>Take a clear "Before" photo. GPS coordinates will be attached automatically.</Text>
        
        {!photo ? (
           <View style={styles.cameraBox}>
             <CameraView style={styles.camera} facing="back" ref={cameraRef}>
                <View style={styles.cameraFooter}>
                  <TouchableOpacity style={styles.shutterBtn} onPress={async () => setPhoto((await cameraRef.current.takePictureAsync()).uri)}>
                    <View style={styles.shutterIn}/>
                  </TouchableOpacity>
                </View>
             </CameraView>
          </View>
        ) : (
           <View style={styles.cameraBox}>
             <Image source={{ uri: photo }} style={styles.camera} />
             <TouchableOpacity style={{ position: 'absolute', bottom: 20, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, borderRadius: 20 }} onPress={() => setPhoto(null)}>
               <Text style={{color: '#FFF', fontFamily: 'Inter_700Bold'}}>Retake Photo</Text>
             </TouchableOpacity>
           </View>
        )}

        <Text style={[styles.h2, { color: colors.textMain, marginBottom: 12 }]}>Mess Size</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {SIZES.map(s => (
            <TouchableOpacity 
              key={s} 
              onPress={() => setSize(s)}
              style={{
                paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1,
                backgroundColor: size === s ? colors.primary : colors.bgCard,
                borderColor: size === s ? colors.primary : colors.border
              }}>
              <Text style={{ fontFamily: 'Inter_700Bold', color: size === s ? '#FFF' : colors.textMain }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.h2, { color: colors.textMain, marginBottom: 12 }]}>Optional Reward</Text>
        <TextInput
          placeholder="e.g. 100"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={reward}
          onChangeText={setReward}
          style={{
            backgroundColor: colors.bgCard,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
            color: colors.textMain,
            fontFamily: 'Inter_400Regular',
            marginBottom: 20
          }}
        />

        <View style={[styles.locationBanner, { backgroundColor: colors.primaryLight }]}><Navigation color={colors.primary} size={20} /><Text style={[styles.locationText, { color: colors.primary }]}>GPS Locked to current location</Text></View>
        
        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: colors.primary }, (!photo || isSubmitting) && { opacity: 0.6 }]} 
          disabled={!photo || isSubmitting} onPress={submitReport}>
          {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Submit Report</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function RanksScreen() {
  const { colors } = useContext(ThemeContext);
  const [tab, setTab] = useState('Cleaners');

  const currentList = tab === 'Cleaners' ? TOP_CLEANERS : TOP_SCOUTS;

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <View style={[styles.appHeader, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.h1, { color: colors.textMain }]}>Leaderboard</Text>
        <View style={{ flexDirection: 'row', marginTop: 12, backgroundColor: colors.bgBase, borderRadius: 8, padding: 4 }}>
           <TouchableOpacity 
             style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: tab === 'Cleaners' ? colors.primary : 'transparent', borderRadius: 6 }} 
             onPress={() => setTab('Cleaners')}
           >
             <Text style={{ fontFamily: 'Inter_700Bold', color: tab === 'Cleaners' ? '#FFF' : colors.textMuted }}>Cleaners</Text>
           </TouchableOpacity>
           <TouchableOpacity 
             style={{ flex: 1, paddingVertical: 8, alignItems: 'center', backgroundColor: tab === 'Scouts' ? colors.primary : 'transparent', borderRadius: 6 }} 
             onPress={() => setTab('Scouts')}
           >
             <Text style={{ fontFamily: 'Inter_700Bold', color: tab === 'Scouts' ? '#FFF' : colors.textMuted }}>Scouts</Text>
           </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[styles.card, { backgroundColor: colors.primaryLight, borderColor: colors.primary, marginBottom: 24 }]}>
           <Text style={[styles.h2, { color: colors.primary, textAlign: 'center' }]}>Your Rank ({tab}): #142</Text>
           <Text style={[styles.p, { color: colors.primary, textAlign: 'center' }]}>1,240 pts — Earth Scavenger</Text>
        </View>
        {currentList.map(user => (
          <View key={user.id} style={[styles.rankRow, { borderBottomColor: colors.border }]}>
             <Text style={[styles.rankNum, { color: user.rank <= 3 ? colors.warning : colors.textMuted }]}>#{user.rank}</Text>
             <Image source={{uri: user.avatar}} style={styles.rankAvar} />
             <View style={{flex: 1}}><Text style={[styles.h2, { color: colors.textMain, fontSize: 16 }]}>{user.name}</Text><Text style={[styles.p, { color: colors.textMuted, fontSize: 12 }]}>{user.pts} pts</Text></View>
             {user.rank <= 3 && <Trophy color={colors.warning} size={20} />}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useContext(ThemeContext);
  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      <View style={[styles.appHeader, { backgroundColor: colors.bgCard, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.h1, { color: colors.textMain }]}>Profile</Text>
        <TouchableOpacity style={{flexDirection: 'row', alignItems: 'center'}} onPress={toggleTheme}>
           {isDark ? <Moon color={colors.textMain} size={20}/> : <Sun color={colors.warning} size={20}/>}
           <Switch value={isDark} onValueChange={toggleTheme} trackColor={{false: '#CBD5E1', true: colors.primary}} thumbColor="#FFF" style={{transform:[{scale: 0.8}], marginLeft: 8}}/>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.center}>
           <Image source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200' }} style={[styles.profileAvar, { borderColor: colors.primary }]} />
           <Text style={[styles.h1, { color: colors.textMain, marginBottom: 4 }]}>JD EarthSaver</Text>
           <Text style={[styles.p, { color: colors.textMuted }]}>Joined May 2026</Text>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 32}}>
           {[{ label: 'Eco-Points', val: '1,240', icon: <Award color={colors.success} size={24}/> }, { label: 'Cleanups', val: '14', icon: <Camera color={colors.primary} size={24}/> }, { label: 'Trust Score', val: '98%', icon: <Shield color={colors.warning} size={24}/> }].map((stat, i) => (
             <View key={i} style={[styles.statBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                {stat.icon}<Text style={[styles.h2, { color: colors.textMain, marginTop: 8 }]}>{stat.val}</Text><Text style={[styles.p, { color: colors.textMuted, fontSize: 12 }]}>{stat.label}</Text>
             </View>
           ))}
        </View>

        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.success, marginTop: 24 }]}>
           <Store color="#FFF" size={20} />
           <Text style={styles.btnText}> Exchange Points</Text>
        </TouchableOpacity>

        <Text style={[styles.h2, { color: colors.textMain, marginTop: 32, marginBottom: 16 }]}>Settings</Text>
        {['Edit Profile', 'Payment & Payouts', 'Notifications', 'Help & Support'].map((item, i) => (
          <TouchableOpacity key={i} style={[styles.settingRow, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
             <Text style={[styles.p, { color: colors.textMain }]}>{item}</Text><Settings color={colors.textMuted} size={16} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// --- APP & NAVIGATION ---
function TabNavigator() {
  const { colors } = useContext(ThemeContext);
  return (
    <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: colors.bgCard, borderTopColor: colors.border, height: 65, paddingBottom: 10, paddingTop: 5 },
          tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontFamily: 'Inter_700Bold', fontSize: 10 }
        }}>
        <Tab.Screen name="Map" component={MapScreen} options={{ tabBarIcon: ({ color }) => <MapPin color={color} size={24} /> }} />
        <Tab.Screen name="Quests" component={QuestsScreen} options={{ tabBarIcon: ({ color }) => <List color={color} size={24} /> }} />
        <Tab.Screen name="Report" component={ReportScreen} options={{ tabBarLabel: '', tabBarIcon: () => (<View style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}><Plus color="#FFF" size={32} /></View>) }} />
        <Tab.Screen name="Ranks" component={RanksScreen} options={{ tabBarIcon: ({ color }) => <Trophy color={color} size={24} /> }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ color }) => <User color={color} size={24} /> }} />
    </Tab.Navigator>
  )
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  let [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold, Inter_900Black });

  if (!fontsLoaded) return null;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme: () => setIsDark(!isDark), colors: isDark ? darkColors : lightColors }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen name="QuestDetails" component={QuestDetailsScreen} options={{ headerShown: true, title: 'Quest Details', headerBackTitle: 'Map' }} />
          <Stack.Screen name="CompleteQuest" component={CompleteQuestScreen} options={{ headerShown: true, title: 'Verify' }} />
          <Stack.Screen name="StoreDetails" component={StoreDetailsScreen} options={{ headerShown: true, title: 'Partner Store', headerBackTitle: 'Map' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeContext.Provider>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1 }, center: { justifyContent: 'center', alignItems: 'center' },
  h1: { fontFamily: 'Inter_900Black', fontSize: 24, letterSpacing: -0.5 }, h2: { fontFamily: 'Inter_700Bold', fontSize: 18 }, p: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  appHeader: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  card: { padding: 20, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }, tagText: { fontFamily: 'Inter_700Bold', fontSize: 12 },
  btn: { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 16, marginLeft: 8 },
  map: { ...StyleSheet.absoluteFillObject },
  pin: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  headerFloating: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  bellBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  cameraBox: { height: 350, borderRadius: 24, overflow: 'hidden', backgroundColor: '#000', marginBottom: 20 },
  camera: { flex: 1, justifyContent: 'flex-end' },
  cameraFooter: { paddingBottom: 20, alignItems: 'center' },
  shutterBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  shutterIn: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFF' },
  locationBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 24 },
  locationText: { fontFamily: 'Inter_700Bold', fontSize: 14, marginLeft: 8 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  rankNum: { fontFamily: 'Inter_900Black', fontSize: 18, width: 40 },
  rankAvar: { width: 48, height: 48, borderRadius: 24, marginRight: 16 },
  profileAvar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, marginBottom: 16 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginHorizontal: 4 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1 },
  fab: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', top: -20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }
});
