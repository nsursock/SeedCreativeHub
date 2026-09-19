export const typeDefs = /* GraphQL */ `
  scalar DateTime
  scalar JSON

  enum UserRole { member editor admin }
  enum ClaimStatus { unclaimed pending claimed }
  enum WorkType { text image audio video }
  enum WorkStatus { draft published archived hidden }
  enum OpportunityStatus { open closed draft }
  enum EventStatus { draft published cancelled past }
  enum ReportStatus { open resolved dismissed }

  type User {
    id: ID!
    email: String!
    role: UserRole!
    locale: String!
    emailVerifiedAt: DateTime
    profile: Profile
  }

  type Discipline {
    id: ID!
    slug: String!
    nameEn: String!
    nameFr: String!
    nameAr: String!
    nameHe: String!
  }

  type City {
    id: ID!
    slug: String!
    nameEn: String!
    nameFr: String!
    nameAr: String!
    nameHe: String!
  }

  type Profile {
    id: ID!
    handle: String!
    displayName: String!
    bioShort: String
    bioLong: String
    avatarUrl: String
    coverUrl: String
    country: String!
    city: String
    availability: String
    claimStatus: ClaimStatus!
    websiteUrl: String
    instagramUrl: String
    verifiedAt: DateTime
    completionScore: Int!
    isFounding: Boolean!
    disciplines: [Discipline!]!
    works(limit: Int = 12): [Work!]!
    worksCount: Int!
    followerCount: Int!
    followingCount: Int!
    isFollowing: Boolean
  }

  type MediaAsset {
    id: ID!
    kind: String!
    publicUrl: String
    externalUrl: String
    mimeType: String
  }

  type Work {
    id: ID!
    title: String!
    slug: String!
    type: WorkType!
    description: String
    status: WorkStatus!
    externalUrl: String
    embedUrl: String
    publishedAt: DateTime
    viewCount: Int!
    profile: Profile!
    media: [MediaAsset!]!
    primaryDiscipline: Discipline
  }

  type Opportunity {
    id: ID!
    title: String!
    slug: String!
    description: String!
    roles: String
    discipline: String
    location: String
    remoteMode: String
    compensationStatus: String
    deadline: DateTime
    imageUrl: String
    status: OpportunityStatus!
    creator: User!
    interestCount: Int!
  }

  type Event {
    id: ID!
    name: String!
    slug: String!
    description: String
    startsAt: DateTime!
    endsAt: DateTime
    venue: String
    city: String
    category: String
    externalUrl: String
    imageUrl: String
    status: EventStatus!
    isHubNight: Boolean!
    capacity: Int
  }

  type Notification {
    id: ID!
    type: String!
    title: String!
    body: String
    payload: JSON
    readAt: DateTime
    createdAt: DateTime!
  }

  type Report {
    id: ID!
    entityType: String!
    entityId: ID!
    reason: String!
    details: String
    status: ReportStatus!
    createdAt: DateTime!
  }

  type EditorialFeature {
    id: ID!
    entityType: String!
    entityId: ID!
    placement: String!
    sortOrder: Int!
  }

  type ExplorePayload {
    featuredCreators: [Profile!]!
    latestCreators: [Profile!]!
    featuredWorks: [Work!]!
    latestWorks: [Work!]!
    featuredEvents: [Event!]!
    latestEvents: [Event!]!
    featuredOpportunities: [Opportunity!]!
    latestOpportunities: [Opportunity!]!
  }

  type SearchPayload {
    creators: [Profile!]!
    works: [Work!]!
    events: [Event!]!
    opportunities: [Opportunity!]!
  }

  type WaitlistResult {
    ok: Boolean!
    message: String!
  }

  type AuthPayload {
    user: User!
    csrfToken: String!
  }

  type ClaimLinkPayload {
    token: String!
    claimUrl: String!
    expiresAt: DateTime!
  }

  type UploadSession {
    assetId: ID!
    storageKey: String!
    uploadUrl: String!
    headers: JSON
  }

  type AdminStats {
    users: Int!
    profiles: Int!
    claimed: Int!
    unclaimed: Int!
    works: Int!
    opportunities: Int!
    events: Int!
    waitlist: Int!
    openReports: Int!
  }

  type Query {
    health: String!
    me: User
    csrfToken: String
    profile(handle: String!): Profile
    work(slug: String!): Work
    explore: ExplorePayload!
    search(q: String!, discipline: String, city: String, limit: Int = 20): SearchPayload!
    creators(discipline: String, city: String, claimStatus: ClaimStatus, isFounding: Boolean, q: String, limit: Int = 40, offset: Int = 0): [Profile!]!
    works(discipline: String, city: String, type: WorkType, q: String, limit: Int = 40, offset: Int = 0): [Work!]!
    opportunities(status: OpportunityStatus = open, limit: Int = 40): [Opportunity!]!
    opportunity(slug: String!): Opportunity
    events(limit: Int = 40, upcomingOnly: Boolean = true): [Event!]!
    event(slug: String!): Event
    notifications(limit: Int = 30): [Notification!]!
    disciplines: [Discipline!]!
    cities: [City!]!
    adminStats: AdminStats!
    adminProfiles(q: String, claimStatus: ClaimStatus, limit: Int = 50, offset: Int = 0): [Profile!]!
    adminReports(status: ReportStatus = open, limit: Int = 50): [Report!]!
    adminWaitlist(limit: Int = 100): [WaitlistEntry!]!
  }

  type WaitlistEntry {
    id: ID!
    email: String!
    displayName: String
    disciplines: [String!]!
    locale: String!
    createdAt: DateTime!
  }

  input JoinWaitlistInput {
    email: String!
    disciplines: [String!]!
    locale: String
    referralCode: String
    displayName: String
  }

  input SignUpInput {
    email: String!
    password: String!
    displayName: String!
    handle: String!
    locale: String
    acceptTerms: Boolean!
  }

  input SignInInput {
    email: String!
    password: String!
  }

  input ClaimProfileInput {
    token: String!
    email: String!
    password: String!
    acceptTerms: Boolean!
  }

  input UpdateProfileInput {
    displayName: String
    bioShort: String
    bioLong: String
    city: String
    country: String
    websiteUrl: String
    instagramUrl: String
    availability: String
    disciplineSlugs: [String!]
  }

  input CreateWorkInput {
    title: String!
    type: WorkType!
    description: String
    primaryDiscipline: String
    externalUrl: String
    embedUrl: String
    status: WorkStatus
  }

  input CreateOpportunityInput {
    title: String!
    description: String!
    roles: String
    discipline: String
    location: String
    remoteMode: String
    compensationStatus: String
    deadline: DateTime
    imageUrl: String
    status: OpportunityStatus
  }

  input CreateEventInput {
    name: String!
    description: String
    startsAt: DateTime!
    endsAt: DateTime
    venue: String
    city: String
    category: String
    externalUrl: String
    imageUrl: String
    capacity: Int
    status: EventStatus
    isHubNight: Boolean
  }

  input AdminCreateProfileInput {
    handle: String!
    displayName: String!
    bioShort: String
    city: String
    country: String
    websiteUrl: String
    instagramUrl: String
    disciplineSlugs: [String!]
    isFounding: Boolean
  }

  input AdminImportProfileInput {
    handle: String!
    displayName: String!
    bioShort: String
    city: String
    websiteUrl: String
    instagramUrl: String
    disciplineSlugs: [String!]
  }

  input ContactInput {
    toProfileId: ID!
    subject: String!
    message: String!
  }

  input ReportInput {
    entityType: String!
    entityId: ID!
    reason: String!
    details: String
  }

  input OnboardingInput {
    displayName: String
    handle: String
    disciplineSlugs: [String!]
    city: String
    country: String
    intent: String
  }

  type Mutation {
    joinWaitlist(input: JoinWaitlistInput!): WaitlistResult!
    signUp(input: SignUpInput!): AuthPayload!
    signIn(input: SignInInput!): AuthPayload!
    signOut: Boolean!
    requestMagicLink(email: String!): WaitlistResult!
    consumeMagicLink(token: String!): AuthPayload!
    claimProfile(input: ClaimProfileInput!): AuthPayload!
    completeOnboarding(input: OnboardingInput!): Profile!
    updateProfile(input: UpdateProfileInput!): Profile!
    createWork(input: CreateWorkInput!): Work!
    updateWork(id: ID!, input: CreateWorkInput!): Work!
    publishWork(id: ID!): Work!
    createOpportunity(input: CreateOpportunityInput!): Opportunity!
    expressInterest(opportunityId: ID!, message: String): Opportunity!
    createEvent(input: CreateEventInput!): Event!
    follow(profileId: ID!): Boolean!
    unfollow(profileId: ID!): Boolean!
    sendContact(input: ContactInput!): Boolean!
    createReport(input: ReportInput!): Report!
    markNotificationRead(id: ID!): Notification!
    markAllNotificationsRead: Boolean!
    createUpload(filename: String!, mimeType: String!, sizeBytes: Int!): UploadSession!

    # Admin
    adminCreateProfile(input: AdminCreateProfileInput!): Profile!
    adminUpdateProfile(id: ID!, input: AdminCreateProfileInput!): Profile!
    adminImportProfiles(profiles: [AdminImportProfileInput!]!): [Profile!]!
    adminGenerateClaimLink(profileId: ID!): ClaimLinkPayload!
    adminVerifyProfile(id: ID!, verified: Boolean!): Profile!
    adminSuspendUser(userId: ID!, suspended: Boolean!): User!
    adminCreateWork(profileId: ID!, input: CreateWorkInput!): Work!
    adminFeature(entityType: String!, entityId: ID!, placement: String!, sortOrder: Int = 0): EditorialFeature!
    adminUnfeature(id: ID!): Boolean!
    adminResolveReport(id: ID!, status: ReportStatus!): Report!
    adminCreateEvent(input: CreateEventInput!): Event!
    adminCreateOpportunity(creatorUserId: ID!, input: CreateOpportunityInput!): Opportunity!
  }
`;
