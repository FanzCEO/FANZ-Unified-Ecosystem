import { storage } from '../storage.js';

export async function seedDatabase() {
  
  console.log('🌱 Seeding FanzFiliate database...');
  console.log('═'.repeat(40));
  
  try {
    // Seed Users
    console.log('👥 Creating users...');
    
    // Admin user
    const admin = await storage.createUser({
      email: 'admin@fanzfiliate.fun',
      username: 'admin',
      role: 'admin',
      isActive: true
    });
    console.log(`   ✅ Admin: ${admin.email}`);
    
    // Advertiser 
    const advertiser = await storage.createUser({
      email: 'advertiser@fanzcommerce.fun',
      username: 'advertiser',
      role: 'advertiser',
      isActive: true
    });
    console.log(`   ✅ Advertiser: ${advertiser.email}`);
    
    // Affiliates
    const affiliate1 = await storage.createUser({
      email: 'creator1@boyfanz.fun',
      username: 'creator1',
      role: 'affiliate',
      isActive: true
    });
    console.log(`   ✅ Affiliate 1: ${affiliate1.email}`);
    
    const affiliate2 = await storage.createUser({
      email: 'creator2@girlfanz.fun',
      username: 'creator2',
      role: 'affiliate',
      isActive: true
    });
    console.log(`   ✅ Affiliate 2: ${affiliate2.email}`);
    
    // Seed Offers
    console.log('\n🎯 Creating offers...');
    
    const cpaOffer = await storage.createOffer({
      advertiserId: advertiser.id,
      name: 'Premium Adult Content Subscription',
      description: 'High-converting adult subscription offers from verified creators',
      conversionType: 'CPA',
      payoutAmount: '25.00',
      status: 'approved',
      landingPageUrl: 'https://fanzcommerce.fun/premium-signup',
      isActive: true
    });
    console.log(`   ✅ CPA Offer: ${cpaOffer.name} ($${cpaOffer.payoutAmount})`);
    
    const revshareOffer = await storage.createOffer({
      advertiserId: advertiser.id,
      name: 'Creator Revenue Share Program',
      description: '30% revenue share on all creator purchases and subscriptions',
      conversionType: 'RevShare',
      payoutAmount: '30.00',
      status: 'approved',
      landingPageUrl: 'https://boyfanz.fun/creators/signup',
      isActive: true
    });
    console.log(`   ✅ RevShare Offer: ${revshareOffer.name} (${revshareOffer.payoutAmount}%)`);
    
    // Seed Creatives
    console.log('\n🎨 Creating creatives...');
    
    const creative1 = await storage.createCreative({
      offerId: cpaOffer.id,
      name: 'Premium Banner 728x90',
      type: 'banner',
      size: '728x90',
      content: '<img src="https://assets.fanzfiliate.fun/banners/premium-728x90.jpg" alt="Premium Adult Content" width="728" height="90">',
      status: 'active'
    });
    console.log(`   ✅ Banner: ${creative1.name} (${creative1.size})`);
    
    const creative2 = await storage.createCreative({
      offerId: cpaOffer.id,
      name: 'Mobile Banner 320x50',
      type: 'banner',
      size: '320x50',
      content: '<img src="https://assets.fanzfiliate.fun/banners/premium-320x50.jpg" alt="Premium Adult Content" width="320" height="50">',
      status: 'active'
    });
    console.log(`   ✅ Mobile Banner: ${creative2.name} (${creative2.size})`);
    
    const creative3 = await storage.createCreative({
      offerId: revshareOffer.id,
      name: 'RevShare Widget',
      type: 'widget',
      size: '300x250', 
      content: '<div class="fanzfiliate-widget" data-offer="offer-2" style="width:300px;height:250px;background:linear-gradient(45deg,#000,#333);color:#FFE100;padding:20px;border-radius:10px;"><h3>Earn 30% Revenue Share!</h3><p>Join the creator economy</p><button>Sign Up Now</button></div>',
      status: 'active'
    });
    console.log(`   ✅ Widget: ${creative3.name} (${creative3.size})`);
    
    const creative4 = await storage.createCreative({
      offerId: revshareOffer.id,
      name: 'Text Link', 
      type: 'text',
      size: 'responsive',
      content: '<a href="{TRACKING_URL}" style="color:#FFE100;text-decoration:none;font-weight:bold;">Join the creator revolution - Earn 30% on every sale!</a>',
      status: 'active'
    });
    console.log(`   ✅ Text Link: ${creative4.name}`);
    
    // Seed Tracking Links
    console.log('\n🔗 Creating tracking links...');
    
    const link1 = await storage.createTrackingLink({
      affiliateId: affiliate1.id,
      offerId: cpaOffer.id,
      code: 'FF_AFF1_PREMIUM',
      deepLink: 'https://fanzcommerce.fun/premium-signup?ref=aff1',
      subId: 'boyfanz-promo'
    });
    console.log(`   ✅ Link: ${link1.code} → ${link1.deepLink}`);
    
    const link2 = await storage.createTrackingLink({
      affiliateId: affiliate2.id,
      offerId: revshareOffer.id,
      code: 'FF_AFF2_REVSHARE', 
      deepLink: 'https://boyfanz.fun/creators/signup?ref=aff2',
      subId: 'girlfanz-creators'
    });
    console.log(`   ✅ Link: ${link2.code} → ${link2.deepLink}`);
    
    // Seed Test Clicks & Conversions
    console.log('\n👆 Creating test clicks...');
    
    for (let i = 1; i <= 6; i++) {
      const click = await storage.createClick({
        affiliateId: i <= 3 ? affiliate1.id : affiliate2.id,
        offerId: i <= 3 ? cpaOffer.id : revshareOffer.id,
        ipAddress: `192.168.1.${100 + i}`,
        userAgent: 'Mozilla/5.0 (Chrome/91.0) FanzFiliate-TestAgent',
        referrer: i <= 3 ? 'https://boyfanz.fun' : 'https://girlfanz.fun',
        geoCountry: 'US'
      });
      console.log(`   ✅ Click ${i}: ${click.ipAddress} → ${click.offerId}`);
    }
    
    console.log('\n💰 Creating test conversions...');
    
    // Cookie-attributed conversion
    const conversion1 = await storage.createConversion({
      affiliateId: affiliate1.id,
      offerId: cpaOffer.id,
      txid: 'txn-premium-001',
      amount: '25.00',
      commission: '25.00',
      currency: 'USD',
      status: 'approved'
    });
    console.log(`   ✅ Conversion 1: $${conversion1.amount} via cookie (${conversion1.txid})`);
    
    // S2S postback conversion
    const conversion2 = await storage.createConversion({
      affiliateId: affiliate2.id,
      offerId: revshareOffer.id,
      txid: 'txn-revshare-002',
      amount: '45.50',
      commission: '13.65',
      currency: 'USD',
      status: 'approved'
    });
    console.log(`   ✅ Conversion 2: $${conversion2.amount} via S2S (${conversion2.txid})`);
    
    // Seed User Balances
    console.log('\n💳 Setting up balances...');
    
    const balance1 = await storage.createOrUpdateBalance({
      userId: affiliate1.id,
      availableBalance: '1250.75',
      pendingBalance: '420.25',
      totalEarnings: '15420.75'
    });
    console.log(`   ✅ Affiliate 1: $${balance1.availableBalance} available, $${balance1.pendingBalance} pending`);
    
    const balance2 = await storage.createOrUpdateBalance({
      userId: affiliate2.id,
      availableBalance: '850.50', 
      pendingBalance: '315.00',
      totalEarnings: '8940.25'
    });
    console.log(`   ✅ Affiliate 2: $${balance2.availableBalance} available, $${balance2.pendingBalance} pending`);
    
    console.log('\n🎉 Database seeded successfully!');
    console.log('   📊 Created: 4 users, 2 offers, 4 creatives, 2 links, 6 clicks, 2 conversions');
    console.log('   💰 Total earnings: $24,361.00 across affiliates');
    console.log('   🔗 Ready for affiliate link generation and tracking');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}