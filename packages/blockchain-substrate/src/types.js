/**
 * Types definition.
 */
module.exports = {
  types: {
    Accumulator: {
      infinity: 'Vec<u8>',
      g: 'Vec<u8>',
      n: 'Vec<u8>',
      h: 'Vec<u8>',
      c: 'Vec<u8>',
      z: 'Vec<u8>',
      q: 'Vec<u8>',
      i: 'u32'
    },
    IdSpaceReleases: {
      _enum: [
        'V1_0_0',
        'V2_0_0'
      ]
    },
    CID: {
      // Release of this CID template.
      release: 'IdSpaceReleases',
      // Hash of the CID template.
      cid: 'Vec<u8>',
      // Owner account the creates this CID.
      owner: 'AccountId',
      // Owner's DID.
      did_owner: 'Vec<u8>',
      // Maximum HIDs allow to issue based on this CID.
      max_hids_issue: 'u64',
      // Total HIDs issued so far.
      total_hids_issued: 'u64',
      // Date when the template CID was created.
      block_created: 'BlockNumber',
      // Block when this template CID ws created.
      block_valid_from: 'BlockNumber',
      // Block when this template CID was invalidated. (0 means that it still valid).
      block_valid_to: 'BlockNumber'
    },
    PublicKey: {
      release: 'IdSpaceReleases',
      pub_key: 'Vec<u8>',
      block_valid_from: 'BlockNumber',
      block_valid_to: 'BlockNumber'
    },
    PublicKeyType: {
      release: 'IdSpaceReleases',
      pub_key_type: 'u16',
      pub_keys: 'Vec<PublicKey>',
      block_valid_from: 'BlockNumber',
      block_valid_to: 'BlockNumber'
    },
    Credential: {
      release: 'IdSpaceReleases',
      credential: 'Vec<u8>',
      accumulator: 'Accumulator',
      block_valid_from: 'BlockNumber',
      block_valid_to: 'BlockNumber'
    },
    DIDInfo: {
      release: 'IdSpaceReleases',
      name: 'Option<Vec<u8>>',
      address: 'Option<Vec<u8>>',
      postal_code: 'Option<Vec<u8>>',
      city: 'Option<Vec<u8>>',
      country_code: 'Option<Vec<u8>>',
      phone_number: 'Option<Vec<u8>>',
      website: 'Option<Vec<u8>>',
      endpoint: 'Option<Vec<u8>>'
    },
    DIDData: {
      release: 'IdSpaceReleases',
      did_version: 'u8',
      network_id: 'u16',
      did_type: 'u8',
      owner: 'AccountId',
      did_promoter: 'Vec<u8>',
      level: 'u16',
      pub_keys: 'Vec<PublicKeyType>',
      legal_name: 'Vec<u8>',
      tax_id: 'Vec<u8>',
      did_doc: 'Vec<u8>',
      credentials: 'Vec<Credential>',
      info: 'DIDInfo',
      block_valid_from: 'BlockNumber',
      block_valid_to: 'BlockNumber'
    },
    NftClassId: 'Vec<u8>',
    NftInstanceId: 'Vec<u8>',
    NodeType: {
      _enum: [
        'Process',
        'SubProcess',
        'Step',
        'Document',
        'Attachment',
        'None'
      ]
    },
    ProcessNode: {
      did: 'Vec<u8>',
      account: 'AccountId',
      node_type: 'NodeType',
      parent: 'Option<Vec<u8>>',
      children: 'Option<Vec<Vec<u8>>>',
      created_block: 'BlockNumber',
      valid_until: 'BlockNumber'
    },
    SuspensionJudgement: {
      _enum: [
        'Rebid',
        'Reject',
        'Approve'
      ]
    }
  }
}
