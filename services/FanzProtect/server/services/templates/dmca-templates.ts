// DMCA Template System
// Professional legal document templates with variable substitution

export interface DMCATemplateVariables {
  // Creator/Copyright Owner Information
  creatorName: string;
  creatorEmail: string;
  creatorAddress: string;
  businessName?: string;
  copyrightOwner?: string;
  copyrightRegistration?: string;
  
  // Case Information
  caseId: string;
  caseNumber: string;
  infringementDate: string;
  originalWorkDate: string;
  
  // Target/Infringing Information
  platformName: string;
  platformEmail: string;
  infringingUrl: string;
  originalContentUrl: string;
  targetUserHandle?: string;
  targetUserId?: string;
  
  // Evidence Information
  evidenceUrls: string[];
  screenshotUrls: string[];
  additionalEvidence: string;
  
  // Legal Information
  jurisdiction: string;
  applicableLaws: string[];
  requestedAction: string;
  deadline?: string;
  
  // Generated Information
  currentDate: string;
  signature: string;
}

// Generic DMCA Takedown Notice Template
export const genericDMCATemplate = `
# DMCA TAKEDOWN NOTICE

**TO:** {{platformName}} Legal Department  
**FROM:** {{creatorName}}  
**DATE:** {{currentDate}}  
**RE:** Copyright Infringement Notice - Case {{caseNumber}}

---

## COPYRIGHT INFRINGEMENT NOTIFICATION

I, {{creatorName}}, am the owner of intellectual property rights that are being infringed upon on your platform. I have a good faith belief that the material identified below is not authorized by the copyright owner, its agent, or the law.

### COPYRIGHT OWNER INFORMATION
- **Name:** {{creatorName}}
- **Email:** {{creatorEmail}}
- **Address:** {{creatorAddress}}
{{#if businessName}}- **Business:** {{businessName}}{{/if}}
{{#if copyrightRegistration}}- **Copyright Registration:** {{copyrightRegistration}}{{/if}}

### INFRINGEMENT DETAILS
- **Original Work Creation Date:** {{originalWorkDate}}
- **Date of Infringement:** {{infringementDate}}
- **Original Content Location:** {{originalContentUrl}}
- **Infringing Content Location:** {{infringingUrl}}
{{#if targetUserHandle}}- **Infringing User:** {{targetUserHandle}}{{/if}}

### EVIDENCE OF INFRINGEMENT
{{#each evidenceUrls}}
- Evidence {{@index}}: {{this}}
{{/each}}

{{#if additionalEvidence}}
**Additional Evidence:**
{{additionalEvidence}}
{{/if}}

### REQUESTED ACTION
{{requestedAction}}

### LEGAL STATEMENT
I state, under penalty of perjury, that:
1. I am authorized to act on behalf of the owner of the copyright that is allegedly infringed
2. The information provided in this notice is accurate
3. I have a good faith belief that the use of the material is not authorized by the copyright owner, its agent, or the law

**Electronic Signature:** {{signature}}
**Date:** {{currentDate}}

---
*This notice is sent in accordance with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512.*
`;

// YouTube-Specific DMCA Template
export const youtubeDMCATemplate = `
# COPYRIGHT INFRINGEMENT NOTIFICATION FOR YOUTUBE

**TO:** YouTube Legal Support Team (copyright@youtube.com)  
**FROM:** {{creatorName}}  
**DATE:** {{currentDate}}  
**SUBJECT:** DMCA Takedown Request - Case {{caseNumber}}

---

## DMCA TAKEDOWN NOTICE

This is a formal notification under the Digital Millennium Copyright Act (DMCA) requesting the removal of copyrighted material.

### COPYRIGHT HOLDER INFORMATION
- **Full Legal Name:** {{creatorName}}
- **Email Address:** {{creatorEmail}}
- **Mailing Address:** {{creatorAddress}}
- **Phone Number:** [Required - Please add phone number]
{{#if businessName}}- **Company/Organization:** {{businessName}}{{/if}}

### COPYRIGHTED WORK IDENTIFICATION
- **Original Work URL:** {{originalContentUrl}}
- **Work Creation Date:** {{originalWorkDate}}
- **Type of Work:** [Video/Image/Audio/Other]
{{#if copyrightRegistration}}- **Copyright Registration Number:** {{copyrightRegistration}}{{/if}}

### INFRINGING MATERIAL IDENTIFICATION
- **Infringing Video URL:** {{infringingUrl}}
- **Channel Name/ID:** {{targetUserHandle}}
- **Description of Infringement:** The uploaded video contains my copyrighted material without authorization
- **Timestamp of Infringing Content:** [If applicable - specify time range]

### CONTACT INFORMATION FOR ALLEGED INFRINGER (if known)
{{#if targetUserHandle}}- **Channel:** {{targetUserHandle}}{{/if}}
{{#if targetUserId}}- **User ID:** {{targetUserId}}{{/if}}

### GOOD FAITH STATEMENT
I have a good faith belief that use of the copyrighted materials described above on the allegedly infringing web pages is not authorized by the copyright owner, its agent, or the law.

### ACCURACY STATEMENT
I swear, under penalty of perjury, that the information in the notification is accurate and that I am the copyright owner or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

### ELECTRONIC SIGNATURE
**Signature:** {{signature}}  
**Printed Name:** {{creatorName}}  
**Date:** {{currentDate}}  
**Title:** Copyright Owner

---

**Evidence Documentation:**
{{#each evidenceUrls}}
- {{this}}
{{/each}}

*Please confirm receipt of this notice and provide an estimated timeline for removal.*
`;

// Instagram-Specific DMCA Template
export const instagramDMCATemplate = `
# INSTAGRAM COPYRIGHT INFRINGEMENT REPORT

**TO:** Instagram Legal Team  
**FROM:** {{creatorName}}  
**DATE:** {{currentDate}}  
**CASE:** {{caseNumber}}

---

## INTELLECTUAL PROPERTY INFRINGEMENT NOTIFICATION

I am reporting copyright infringement of my intellectual property on Instagram.

### MY INFORMATION
- **Full Name:** {{creatorName}}
- **Email:** {{creatorEmail}}
- **Address:** {{creatorAddress}}
{{#if businessName}}- **Business/Brand:** {{businessName}}{{/if}}

### COPYRIGHTED CONTENT
- **My Original Content:** {{originalContentUrl}}
- **Content Type:** [Photo/Video/Story/Reel]
- **Creation Date:** {{originalWorkDate}}
- **Copyright Details:** {{#if copyrightRegistration}}Registration: {{copyrightRegistration}}{{else}}Unregistered work{{/if}}

### INFRINGING CONTENT ON INSTAGRAM
- **Infringing Post URL:** {{infringingUrl}}
- **Instagram Handle:** {{targetUserHandle}}
- **Date Found:** {{infringementDate}}
- **Description:** Unauthorized use of my copyrighted material

### SUPPORTING EVIDENCE
{{#each evidenceUrls}}
- Evidence File {{@index}}: {{this}}
{{/each}}

### REQUESTED ACTION
I request that Instagram remove the infringing content immediately and take appropriate action against the account holder for copyright violation.

### LEGAL DECLARATIONS
- ✅ I have a good faith belief that the reported use is not authorized
- ✅ This notification is accurate to the best of my knowledge
- ✅ I am the copyright owner or authorized to act on the owner's behalf
- ✅ I understand that submitting false claims may result in account termination

**Digital Signature:** {{signature}}  
**Date:** {{currentDate}}

---
*Submitted under Instagram's copyright reporting procedures and DMCA guidelines.*
`;

// TikTok-Specific DMCA Template
export const tiktokDMCATemplate = `
# TIKTOK COPYRIGHT INFRINGEMENT REPORT

**TO:** TikTok Legal Team  
**SUBMITTED VIA:** TikTok Copyright Reporting Form  
**DATE:** {{currentDate}}  
**REFERENCE:** Case {{caseNumber}}

---

## COPYRIGHT VIOLATION NOTIFICATION

### REPORTER INFORMATION
- **Legal Name:** {{creatorName}}
- **Email Address:** {{creatorEmail}}
- **Physical Address:** {{creatorAddress}}
{{#if businessName}}- **Organization:** {{businessName}}{{/if}}

### ORIGINAL COPYRIGHTED WORK
- **Content Location:** {{originalContentUrl}}
- **Content Type:** [Select: Video, Audio, Image, Other]
- **Creation Date:** {{originalWorkDate}}
- **Description:** [Brief description of original work]

### INFRINGING TIKTOK CONTENT
- **TikTok Video URL:** {{infringingUrl}}
- **TikTok Username:** {{targetUserHandle}}
- **Date of Infringement:** {{infringementDate}}
- **Specific Infringing Elements:** [Describe which parts of the video infringe]

### EVIDENCE OF OWNERSHIP
{{#each evidenceUrls}}
- Supporting Document {{@index}}: {{this}}
{{/each}}

### GOOD FAITH BELIEF STATEMENT
I have a good faith belief that the use of my copyrighted material in the reported TikTok video is not authorized by me, my agent, or the law.

### PENALTY OF PERJURY STATEMENT
Under penalty of perjury, I certify that:
1. The information in this notification is accurate
2. I am the copyright owner or authorized to act on behalf of the copyright owner
3. I understand that TikTok may share this report with the reported user

**Electronic Signature:** {{signature}}  
**Full Name:** {{creatorName}}  
**Date:** {{currentDate}}

---
*This report is submitted in accordance with TikTok's Copyright Policy and applicable copyright laws.*
`;

// Twitter/X-Specific DMCA Template
export const twitterDMCATemplate = `
# X (TWITTER) COPYRIGHT COMPLAINT

**TO:** X Corp. Legal Department  
**FROM:** {{creatorName}}  
**DATE:** {{currentDate}}  
**SUBJECT:** Copyright Infringement - Case {{caseNumber}}

---

## DMCA TAKEDOWN REQUEST

### COMPLAINANT INFORMATION
- **Full Name:** {{creatorName}}
- **Email:** {{creatorEmail}}
- **Mailing Address:** {{creatorAddress}}
{{#if businessName}}- **Company:** {{businessName}}{{/if}}

### COPYRIGHTED WORK
- **Original Work URL:** {{originalContentUrl}}
- **Work Description:** [Description of copyrighted material]
- **Publication Date:** {{originalWorkDate}}
{{#if copyrightRegistration}}- **Registration:** {{copyrightRegistration}}{{/if}}

### ALLEGEDLY INFRINGING CONTENT
- **Infringing Tweet URL:** {{infringingUrl}}
- **X Username:** {{targetUserHandle}}
- **Date Discovered:** {{infringementDate}}
- **Description of Infringement:** [Explain how the tweet infringes your copyright]

### EVIDENCE ATTACHMENTS
{{#each evidenceUrls}}
- {{this}}
{{/each}}

### SWORN STATEMENTS
I state UNDER PENALTY OF PERJURY that:

1. **Good Faith Belief:** I have a good faith belief that use of the copyrighted materials described above is not authorized by the copyright owner, its agent, or the law.

2. **Accuracy:** The information in this notification is accurate.

3. **Authority:** I am the owner, or authorized to act on behalf of the owner, of the copyright that is allegedly infringed.

### ELECTRONIC SIGNATURE
**Signature:** {{signature}}  
**Printed Name:** {{creatorName}}  
**Capacity:** [Copyright Owner / Authorized Agent]  
**Date:** {{currentDate}}

---
*This notification is sent pursuant to the Digital Millennium Copyright Act (17 USC § 512) and X's Copyright Policy.*
`;

// OnlyFans-Specific DMCA Template
export const onlyfansDMCATemplate = `
# ONLYFANS COPYRIGHT INFRINGEMENT NOTICE

**TO:** OnlyFans Legal Team (legal@onlyfans.com)  
**FROM:** {{creatorName}}  
**DATE:** {{currentDate}}  
**CASE:** {{caseNumber}}

---

## COPYRIGHT VIOLATION REPORT

### CONTENT CREATOR INFORMATION
- **Creator Name:** {{creatorName}}
- **Contact Email:** {{creatorEmail}}
- **Address:** {{creatorAddress}}
- **OnlyFans Profile:** [If applicable]
{{#if businessName}}- **Business Name:** {{businessName}}{{/if}}

### ORIGINAL CONTENT DETAILS
- **Content Location:** {{originalContentUrl}}
- **Content Type:** [Photo/Video/Live Stream/Story]
- **Original Publication Date:** {{originalWorkDate}}
- **Content Description:** [Brief description of copyrighted content]

### INFRINGING CONTENT ON ONLYFANS
- **Infringing Content URL:** {{infringingUrl}}
- **Infringing Profile:** {{targetUserHandle}}
- **Date of Infringement:** {{infringementDate}}
- **Violation Details:** Unauthorized distribution of my exclusive content

### SUPPORTING DOCUMENTATION
{{#each evidenceUrls}}
- Evidence {{@index}}: {{this}}
{{/each}}

### COPYRIGHT STATEMENTS
I hereby state under penalty of perjury that:
- I am the copyright owner of the content described above
- The infringing use is not authorized by me, my agent, or the law
- This notification is submitted in good faith
- The information provided is accurate to the best of my knowledge

### REQUESTED REMEDIAL ACTION
I request that OnlyFans:
1. Remove the infringing content immediately
2. Notify the infringing user of this violation
3. Take appropriate action against repeat infringers
4. Provide confirmation of content removal

**Electronic Signature:** {{signature}}  
**Legal Name:** {{creatorName}}  
**Date:** {{currentDate}}

---
*This notice is submitted under OnlyFans Terms of Service and applicable copyright laws including the DMCA.*
`;

// Template Registry
export const dmcaTemplates = {
  generic: genericDMCATemplate,
  youtube: youtubeDMCATemplate,
  instagram: instagramDMCATemplate,
  tiktok: tiktokDMCATemplate,
  twitter: twitterDMCATemplate,
  onlyfans: onlyfansDMCATemplate
};

// Template metadata for UI
export const templateMetadata = {
  generic: {
    name: 'Generic DMCA Notice',
    description: 'Standard DMCA takedown notice for any platform',
    category: 'dmca_notice',
    platforms: ['generic'],
    language: 'en',
    jurisdiction: 'US'
  },
  youtube: {
    name: 'YouTube Copyright Strike',
    description: 'YouTube-specific DMCA takedown request',
    category: 'dmca_notice',
    platforms: ['youtube'],
    language: 'en',
    jurisdiction: 'US',
    successRate: 85,
    averageResponseTime: 3 // days
  },
  instagram: {
    name: 'Instagram Copyright Report',
    description: 'Instagram copyright infringement report',
    category: 'dmca_notice',
    platforms: ['instagram'],
    language: 'en',
    jurisdiction: 'US',
    successRate: 78,
    averageResponseTime: 5
  },
  tiktok: {
    name: 'TikTok Copyright Complaint',
    description: 'TikTok copyright violation notification',
    category: 'dmca_notice',
    platforms: ['tiktok'],
    language: 'en',
    jurisdiction: 'US',
    successRate: 82,
    averageResponseTime: 4
  },
  twitter: {
    name: 'X (Twitter) DMCA Request',
    description: 'X platform copyright complaint',
    category: 'dmca_notice',
    platforms: ['twitter', 'x'],
    language: 'en',
    jurisdiction: 'US',
    successRate: 75,
    averageResponseTime: 7
  },
  onlyfans: {
    name: 'OnlyFans Content Protection',
    description: 'OnlyFans copyright infringement notice',
    category: 'dmca_notice',
    platforms: ['onlyfans'],
    language: 'en',
    jurisdiction: 'US',
    successRate: 90,
    averageResponseTime: 2
  }
};