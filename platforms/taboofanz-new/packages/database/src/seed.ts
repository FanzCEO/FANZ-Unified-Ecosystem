import { PrismaClient, Archetype, PowerEnergy, UserRole, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌙 Seeding TabooFanz database...');

  // ==========================================================================
  // SEED TAG GROUPS AND TAGS
  // ==========================================================================

  console.log('Creating tag groups...');

  // Identity / Subculture
  const identityGroup = await prisma.tagGroup.upsert({
    where: { slug: 'identity-subculture' },
    update: {},
    create: {
      name: 'Identity / Subculture',
      slug: 'identity-subculture',
      description: 'Alternative identities and subcultures',
      sortOrder: 1,
    },
  });

  const identityTags = [
    { name: 'Alt', slug: 'alt', icon: '🖤' },
    { name: 'Goth', slug: 'goth', icon: '🦇' },
    { name: 'Emo', slug: 'emo', icon: '💔' },
    { name: 'Punk', slug: 'punk', icon: '🎸' },
    { name: 'Cyberpunk', slug: 'cyberpunk', icon: '🤖' },
    { name: 'E-boy', slug: 'eboy', icon: '⛓️' },
    { name: 'E-girl', slug: 'egirl', icon: '🎀' },
    { name: 'Queer Underground', slug: 'queer-underground', icon: '🌈' },
    { name: 'Genderfluid', slug: 'genderfluid', icon: '✨' },
    { name: 'Androgynous', slug: 'androgynous', icon: '🌓' },
  ];

  for (const tag of identityTags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: { ...tag, groupId: identityGroup.id },
    });
  }

  // Aesthetic / Fashion
  const aestheticGroup = await prisma.tagGroup.upsert({
    where: { slug: 'aesthetic-fashion' },
    update: {},
    create: {
      name: 'Aesthetic / Fashion',
      slug: 'aesthetic-fashion',
      description: 'Alternative fashion and aesthetics',
      sortOrder: 2,
    },
  });

  const aestheticTags = [
    { name: 'Leather Fashion', slug: 'leather-fashion', icon: '🖤' },
    { name: 'Latex Fashion', slug: 'latex-fashion', icon: '💜' },
    { name: 'Harness Fashion', slug: 'harness-fashion', icon: '⛓️' },
    { name: 'Fishnet', slug: 'fishnet', icon: '🕸️' },
    { name: 'Chains & Jewelry', slug: 'chains-jewelry', icon: '💎' },
    { name: 'Masks & Full-Face', slug: 'masks-fullface', icon: '🎭' },
    { name: 'Blacklight & Neon', slug: 'blacklight-neon', icon: '💡' },
    { name: 'Corsetry', slug: 'corsetry', icon: '🎀' },
    { name: 'Platform Boots', slug: 'platform-boots', icon: '👢' },
    { name: 'Body Mods', slug: 'body-mods', icon: '💀' },
  ];

  for (const tag of aestheticTags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: { ...tag, groupId: aestheticGroup.id },
    });
  }

  // Vibe / Archetype
  const vibeGroup = await prisma.tagGroup.upsert({
    where: { slug: 'vibe-archetype' },
    update: {},
    create: {
      name: 'Vibe / Archetype',
      slug: 'vibe-archetype',
      description: 'Persona archetypes and mood vibes',
      sortOrder: 3,
    },
  });

  const vibeTags = [
    { name: 'The Siren', slug: 'archetype-siren', icon: '🧜' },
    { name: 'The Phantom', slug: 'archetype-phantom', icon: '👻' },
    { name: 'The Rebel', slug: 'archetype-rebel', icon: '🔥' },
    { name: 'The Doll', slug: 'archetype-doll', icon: '🎎' },
    { name: 'The Beast', slug: 'archetype-beast', icon: '🐺' },
    { name: 'The Enigma', slug: 'archetype-enigma', icon: '🔮' },
    { name: 'The Oracle', slug: 'archetype-oracle', icon: '👁️' },
    { name: 'The Switch', slug: 'archetype-switch', icon: '⚡' },
    { name: 'The Sovereign', slug: 'archetype-sovereign', icon: '👑' },
    { name: 'Dark & Edgy', slug: 'dark-edgy', icon: '🌑' },
    { name: 'Playful Wickedness', slug: 'playful-wickedness', icon: '😈' },
    { name: 'Flirty Chaos', slug: 'flirty-chaos', icon: '💋' },
    { name: 'Dark Majesty', slug: 'dark-majesty', icon: '🏰' },
    { name: 'Electric Tension', slug: 'electric-tension', icon: '⚡' },
  ];

  for (const tag of vibeTags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: { ...tag, groupId: vibeGroup.id },
    });
  }

  // Power / Energy
  const powerGroup = await prisma.tagGroup.upsert({
    where: { slug: 'power-energy' },
    update: {},
    create: {
      name: 'Power / Energy',
      slug: 'power-energy',
      description: 'Lifestyle power dynamics and energy',
      sortOrder: 4,
    },
  });

  const powerTags = [
    { name: 'Dominant Energy', slug: 'dominant-energy', icon: '🔱' },
    { name: 'Submissive Energy', slug: 'submissive-energy', icon: '🔗' },
    { name: 'Switch Energy', slug: 'switch-energy', icon: '🔄' },
    { name: 'Brat Energy', slug: 'brat-energy', icon: '😜' },
    { name: 'Sir/Madam Vibes', slug: 'sir-madam-vibes', icon: '🎩' },
    { name: 'Worship Vibes', slug: 'worship-vibes', icon: '🙏' },
    { name: 'Primal Energy', slug: 'primal-energy', icon: '🐾' },
    { name: 'Caretaker Energy', slug: 'caretaker-energy', icon: '💝' },
  ];

  for (const tag of powerTags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: { ...tag, groupId: powerGroup.id },
    });
  }

  // Setting / Backdrop
  const settingGroup = await prisma.tagGroup.upsert({
    where: { slug: 'setting-backdrop' },
    update: {},
    create: {
      name: 'Setting / Backdrop',
      slug: 'setting-backdrop',
      description: 'Content settings and backdrops',
      sortOrder: 5,
    },
  });

  const settingTags = [
    { name: 'Neon City', slug: 'neon-city', icon: '🌃' },
    { name: 'Industrial Warehouse', slug: 'industrial-warehouse', icon: '🏭' },
    { name: 'Underground Club', slug: 'underground-club', icon: '🎵' },
    { name: 'Red-Lit Room', slug: 'red-lit-room', icon: '🔴' },
    { name: 'Cyber Chamber', slug: 'cyber-chamber', icon: '💻' },
    { name: 'Digital Void', slug: 'digital-void', icon: '🌀' },
    { name: 'Gothic Manor', slug: 'gothic-manor', icon: '🏚️' },
    { name: 'Dungeon Aesthetic', slug: 'dungeon-aesthetic', icon: '⛓️' },
  ];

  for (const tag of settingTags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: { ...tag, groupId: settingGroup.id },
    });
  }

  // Lifestyle / Roleplay Themes
  const lifestyleGroup = await prisma.tagGroup.upsert({
    where: { slug: 'lifestyle-roleplay' },
    update: {},
    create: {
      name: 'Lifestyle / Roleplay',
      slug: 'lifestyle-roleplay',
      description: 'High-level lifestyle and roleplay themes',
      sortOrder: 6,
    },
  });

  const lifestyleTags = [
    { name: 'Cyber Witch', slug: 'cyber-witch', icon: '🧙' },
    { name: 'Demoncore', slug: 'demoncore', icon: '👿' },
    { name: 'Vampire Goth', slug: 'vampire-goth', icon: '🧛' },
    { name: 'Masked Mystery', slug: 'masked-mystery', icon: '🎭' },
    { name: 'Hacker/Technomancer', slug: 'hacker-technomancer', icon: '💻' },
    { name: 'Dark Priest/ess', slug: 'dark-priestess', icon: '⛪' },
    { name: 'Fallen Angel', slug: 'fallen-angel', icon: '😇' },
    { name: 'Succubus/Incubus', slug: 'succubus-incubus', icon: '💀' },
  ];

  for (const tag of lifestyleTags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: { ...tag, groupId: lifestyleGroup.id },
    });
  }

  console.log('✅ Tags seeded successfully');

  // ==========================================================================
  // SEED FEATURE FLAGS
  // ==========================================================================

  console.log('Creating feature flags...');

  const featureFlags = [
    {
      key: 'ai_suggestions',
      name: 'AI Suggestions',
      description: 'Enable AI-powered caption and tag suggestions',
      isEnabled: true,
    },
    {
      key: 'live_streaming',
      name: 'Live Streaming',
      description: 'Enable live streaming functionality',
      isEnabled: true,
    },
    {
      key: 'masked_mode',
      name: 'Masked Creator Mode',
      description: 'Enable identity protection features for creators',
      isEnabled: true,
    },
    {
      key: 'archetype_system',
      name: 'Archetype System',
      description: 'Enable TabooFanz archetype personas',
      isEnabled: true,
    },
    {
      key: 'privacy_guardian',
      name: 'Privacy Guardian AI',
      description: 'Enable AI-powered privacy and safety checks on uploads',
      isEnabled: true,
    },
    {
      key: 'collab_content',
      name: 'Collaboration Content',
      description: 'Enable multi-creator collaboration features',
      isEnabled: true,
    },
    {
      key: 'safe_mode',
      name: 'Safe Mode for Fans',
      description: 'Enable lighter content filtering for fans',
      isEnabled: true,
    },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }

  console.log('✅ Feature flags seeded successfully');

  console.log('🌙 TabooFanz database seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
