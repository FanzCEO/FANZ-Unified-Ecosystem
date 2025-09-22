/**
 * Address Normalization and Jurisdiction Resolution Service
 * FANZ Unified Ecosystem - Tax Compliance
 * 
 * Handles address validation, normalization, and jurisdiction resolution
 * for accurate tax determination across all FANZ platforms.
 */

import crypto from 'crypto';
import axios from 'axios';

interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

interface ValidatedAddress extends Address {
  id: string;
  geocode?: {
    latitude: number;
    longitude: number;
  };
  fipsCode?: string;
  validated: boolean;
  validationConfidence: number;
  validationService: string;
  validatedAt: Date;
}

interface Jurisdiction {
  id: string;
  type: 'state' | 'county' | 'city' | 'special';
  name: string;
  code: string;
  fips?: string;
  parentId?: string;
}

interface AddressValidationConfig {
  usps: {
    enabled: boolean;
    apiKey?: string;
    endpoint: string;
  };
  smarty: {
    enabled: boolean;
    authId?: string;
    authToken?: string;
    endpoint: string;
  };
  fallbackChain: ('usps' | 'smarty' | 'geocoding')[];
  cacheEnabled: boolean;
  cacheTtlSeconds: number;
}

class AddressValidationService {
  private config: AddressValidationConfig;
  private cache = new Map<string, ValidatedAddress>();

  constructor(config: AddressValidationConfig) {
    this.config = config;
  }

  /**
   * Validate and normalize an address
   */
  async validateAddress(address: Address): Promise<ValidatedAddress> {
    const addressHash = this.generateAddressHash(address);
    
    // Check cache first
    if (this.config.cacheEnabled && this.cache.has(addressHash)) {
      const cached = this.cache.get(addressHash)!;
      if (this.isCacheValid(cached)) {
        return cached;
      }
    }

    let validatedAddress: ValidatedAddress | null = null;
    let lastError: Error | null = null;

    // Try validation providers in order of preference
    for (const provider of this.config.fallbackChain) {
      try {
        switch (provider) {
          case 'usps':
            if (this.config.usps.enabled) {
              validatedAddress = await this.validateWithUSPS(address);
            }
            break;
          case 'smarty':
            if (this.config.smarty.enabled) {
              validatedAddress = await this.validateWithSmarty(address);
            }
            break;
          case 'geocoding':
            validatedAddress = await this.validateWithGeocoding(address);
            break;
        }

        if (validatedAddress && validatedAddress.validationConfidence >= 0.7) {
          break;
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`Address validation failed with ${provider}:`, error);
      }
    }

    // Fallback to basic validation if all providers fail
    if (!validatedAddress) {
      validatedAddress = this.createBasicValidatedAddress(address, lastError);
    }

    // Cache the result
    if (this.config.cacheEnabled) {
      this.cache.set(addressHash, validatedAddress);
    }

    return validatedAddress;
  }

  /**
   * Resolve jurisdictions for a validated address
   */
  async resolveJurisdictions(address: ValidatedAddress): Promise<Jurisdiction[]> {
    const jurisdictions: Jurisdiction[] = [];

    try {
      // Query database for jurisdictions based on FIPS code and state
      const query = `
        SELECT j.id, j.type, j.name, j.code, j.fips, j.parent_id
        FROM tax_jurisdiction j
        WHERE j.state_code = $1
        AND (j.fips = $2 OR j.type = 'state')
        AND (j.effective_to IS NULL OR j.effective_to > CURRENT_DATE)
        ORDER BY 
          CASE j.type 
            WHEN 'state' THEN 1
            WHEN 'county' THEN 2  
            WHEN 'city' THEN 3
            WHEN 'special' THEN 4
          END,
          j.name
      `;

      // This would be executed against the database
      // For now, we'll simulate the response
      const mockJurisdictions = await this.getMockJurisdictions(address);
      
      return mockJurisdictions;

    } catch (error) {
      console.error('Jurisdiction resolution failed:', error);
      
      // Fallback to state-level jurisdiction only
      return [{
        id: crypto.randomUUID(),
        type: 'state',
        name: this.getStateName(address.state),
        code: address.state,
        fips: address.fipsCode?.substring(0, 2)
      }];
    }
  }

  /**
   * Validate address using USPS API
   */
  private async validateWithUSPS(address: Address): Promise<ValidatedAddress> {
    if (!this.config.usps.apiKey) {
      throw new Error('USPS API key not configured');
    }

    const uspsRequest = {
      'Address': {
        'Address1': address.line2 || '',
        'Address2': address.line1,
        'City': address.city,
        'State': address.state,
        'Zip5': address.postalCode.substring(0, 5),
        'Zip4': address.postalCode.length > 5 ? address.postalCode.substring(6) : ''
      }
    };

    const response = await axios.get(this.config.usps.endpoint, {
      params: {
        API: 'Verify',
        XML: this.buildUSPSXML(uspsRequest)
      }
    });

    // Parse USPS XML response (simplified)
    const validated = this.parseUSPSResponse(response.data);
    
    return {
      id: crypto.randomUUID(),
      line1: validated.Address2 || address.line1,
      line2: validated.Address1 || address.line2,
      city: validated.City || address.city,
      state: validated.State || address.state,
      postalCode: `${validated.Zip5 || address.postalCode.substring(0, 5)}${validated.Zip4 ? '-' + validated.Zip4 : ''}`,
      country: address.country || 'US',
      validated: true,
      validationConfidence: validated.error ? 0.5 : 0.95,
      validationService: 'usps',
      validatedAt: new Date()
    };
  }

  /**
   * Validate address using SmartyStreets API
   */
  private async validateWithSmarty(address: Address): Promise<ValidatedAddress> {
    if (!this.config.smarty.authId || !this.config.smarty.authToken) {
      throw new Error('SmartyStreets credentials not configured');
    }

    const smartyRequest = [{
      street: address.line1,
      street2: address.line2,
      city: address.city,
      state: address.state,
      zipcode: address.postalCode
    }];

    const response = await axios.post(this.config.smarty.endpoint, smartyRequest, {
      params: {
        'auth-id': this.config.smarty.authId,
        'auth-token': this.config.smarty.authToken
      }
    });

    const result = response.data[0];
    
    return {
      id: crypto.randomUUID(),
      line1: result.delivery_line_1 || address.line1,
      line2: result.delivery_line_2 || address.line2,
      city: result.components.city_name || address.city,
      state: result.components.state_abbreviation || address.state,
      postalCode: result.components.zipcode + (result.components.plus4_code ? '-' + result.components.plus4_code : ''),
      country: address.country || 'US',
      geocode: result.metadata.latitude && result.metadata.longitude ? {
        latitude: result.metadata.latitude,
        longitude: result.metadata.longitude
      } : undefined,
      fipsCode: result.metadata.county_fips,
      validated: result.analysis.dpv_match_y === 'Y',
      validationConfidence: result.analysis.dpv_match_y === 'Y' ? 0.98 : 0.7,
      validationService: 'smarty',
      validatedAt: new Date()
    };
  }

  /**
   * Basic geocoding validation as fallback
   */
  private async validateWithGeocoding(address: Address): Promise<ValidatedAddress> {
    // This would integrate with a geocoding service
    // For now, return basic validation
    return {
      id: crypto.randomUUID(),
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || 'US',
      validated: false,
      validationConfidence: 0.3,
      validationService: 'geocoding',
      validatedAt: new Date()
    };
  }

  /**
   * Create a basic validated address when all providers fail
   */
  private createBasicValidatedAddress(address: Address, error?: Error | null): ValidatedAddress {
    return {
      id: crypto.randomUUID(),
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || 'US',
      validated: false,
      validationConfidence: 0.1,
      validationService: 'fallback',
      validatedAt: new Date()
    };
  }

  /**
   * Generate deterministic hash for address caching
   */
  private generateAddressHash(address: Address): string {
    const normalizedAddress = {
      line1: address.line1.toUpperCase().trim(),
      line2: address.line2?.toUpperCase().trim() || '',
      city: address.city.toUpperCase().trim(),
      state: address.state.toUpperCase().trim(),
      postalCode: address.postalCode.replace(/[^0-9]/g, ''),
      country: address.country?.toUpperCase() || 'US'
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(normalizedAddress))
      .digest('hex');
  }

  /**
   * Check if cached address validation is still valid
   */
  private isCacheValid(cached: ValidatedAddress): boolean {
    const ageInSeconds = (Date.now() - cached.validatedAt.getTime()) / 1000;
    return ageInSeconds < this.config.cacheTtlSeconds;
  }

  /**
   * Mock jurisdiction resolution for development
   */
  private async getMockJurisdictions(address: ValidatedAddress): Promise<Jurisdiction[]> {
    const jurisdictions: Jurisdiction[] = [];

    // State jurisdiction (always present)
    const stateId = crypto.randomUUID();
    jurisdictions.push({
      id: stateId,
      type: 'state',
      name: this.getStateName(address.state),
      code: address.state,
      fips: address.fipsCode?.substring(0, 2)
    });

    // Add county if FIPS available
    if (address.fipsCode && address.fipsCode.length >= 5) {
      jurisdictions.push({
        id: crypto.randomUUID(),
        type: 'county',
        name: `${address.city} County`,
        code: 'COUNTY',
        fips: address.fipsCode.substring(0, 5),
        parentId: stateId
      });
    }

    return jurisdictions;
  }

  /**
   * Helper to get full state name from abbreviation
   */
  private getStateName(stateCode: string): string {
    const stateNames: Record<string, string> = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
      'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
      'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
      'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
      'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
      'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
      'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
      'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
      'DC': 'District of Columbia'
    };
    
    return stateNames[stateCode.toUpperCase()] || stateCode;
  }

  /**
   * Build XML for USPS API request
   */
  private buildUSPSXML(request: any): string {
    return `<AddressValidateRequest USERID="${this.config.usps.apiKey}">
      <Address ID="0">
        <Address1>${request.Address.Address1}</Address1>
        <Address2>${request.Address.Address2}</Address2>
        <City>${request.Address.City}</City>
        <State>${request.Address.State}</State>
        <Zip5>${request.Address.Zip5}</Zip5>
        <Zip4>${request.Address.Zip4}</Zip4>
      </Address>
    </AddressValidateRequest>`;
  }

  /**
   * Parse USPS XML response (simplified)
   */
  private parseUSPSResponse(xmlData: string): any {
    // This would parse actual XML response from USPS
    // Returning mock data for now
    return {
      Address1: '',
      Address2: '123 MAIN ST',
      City: 'ANYTOWN',
      State: 'ST',
      Zip5: '12345',
      Zip4: '6789'
    };
  }
}

/**
 * Address Service API Controller
 */
export class AddressController {
  private addressService: AddressValidationService;

  constructor(config: AddressValidationConfig) {
    this.addressService = new AddressValidationService(config);
  }

  /**
   * POST /address/validate
   * Validate and normalize an address
   */
  async validateAddress(req: any, res: any): Promise<void> {
    try {
      const address: Address = req.body;
      
      // Basic validation
      if (!address.line1 || !address.city || !address.state || !address.postalCode) {
        res.status(400).json({
          error: 'Missing required address fields',
          required: ['line1', 'city', 'state', 'postalCode']
        });
        return;
      }

      const validatedAddress = await this.addressService.validateAddress(address);
      
      res.json({
        success: true,
        address: validatedAddress,
        confidence: validatedAddress.validationConfidence,
        service: validatedAddress.validationService
      });

    } catch (error) {
      console.error('Address validation error:', error);
      res.status(500).json({
        error: 'Address validation failed',
        message: (error as Error).message
      });
    }
  }

  /**
   * POST /address/resolve-jurisdictions
   * Resolve tax jurisdictions for an address
   */
  async resolveJurisdictions(req: any, res: any): Promise<void> {
    try {
      const { addressId, address } = req.body;
      
      let validatedAddress: ValidatedAddress;
      
      if (addressId) {
        // Fetch from database by ID (mock implementation)
        validatedAddress = await this.getAddressById(addressId);
      } else if (address) {
        // Validate address first
        validatedAddress = await this.addressService.validateAddress(address);
      } else {
        res.status(400).json({
          error: 'Either addressId or address must be provided'
        });
        return;
      }

      const jurisdictions = await this.addressService.resolveJurisdictions(validatedAddress);
      
      res.json({
        success: true,
        address: validatedAddress,
        jurisdictions,
        jurisdictionCount: jurisdictions.length
      });

    } catch (error) {
      console.error('Jurisdiction resolution error:', error);
      res.status(500).json({
        error: 'Jurisdiction resolution failed',
        message: (error as Error).message
      });
    }
  }

  /**
   * GET /address/:id
   * Retrieve a previously validated address
   */
  async getAddress(req: any, res: any): Promise<void> {
    try {
      const { id } = req.params;
      const address = await this.getAddressById(id);
      
      res.json({
        success: true,
        address
      });

    } catch (error) {
      console.error('Address retrieval error:', error);
      res.status(404).json({
        error: 'Address not found',
        message: (error as Error).message
      });
    }
  }

  /**
   * Mock implementation to get address by ID
   */
  private async getAddressById(id: string): Promise<ValidatedAddress> {
    // This would query the user_address table
    throw new Error('Address not found');
  }
}

export default AddressValidationService;
export { AddressValidationService, AddressController, ValidatedAddress, Jurisdiction, Address };