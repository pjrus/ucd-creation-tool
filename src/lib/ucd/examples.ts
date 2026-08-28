export type UCDExample = {
  id: string
  name: string
  description: string
  source: string
}

export const productDiscoveryExample = `# Product Discovery Workspace

actors:
  - Product Manager
  - Designer
  - Stakeholder

system "Discovery Workspace":
  - Capture Opportunity
  - Review Evidence
  - Prioritise Opportunity
  - Share Roadmap

Product Manager:
  -> Capture Opportunity
  -> Prioritise Opportunity

Designer:
  -> Capture Opportunity
  -> Review Evidence

Stakeholder:
  -> Share Roadmap

"Prioritise Opportunity" ..> "Review Evidence" : include`

export const onlineStoreExample = `# Online Store

actors:
  - Shopper
  - Returning Customer
  - Payment Provider

system "Storefront":
  - Browse Catalogue
  - Place Order
  - Sign In
  - Apply Discount

Returning Customer --|> Shopper

Shopper:
  -> Browse Catalogue
  -> Place Order

Payment Provider -> "Place Order"

"Place Order" ..> "Sign In" : include
"Apply Discount" ..> "Place Order" : extend`

export const serviceDeskExample = `# Service Desk

actors:
  - Employee
  - Support Agent
  - Team Lead

system "Support Portal":
  - Submit Request
  - Review Request
  - Escalate Request
  - Resolve Request

Team Lead --|> Support Agent

Employee -> "Submit Request"
Support Agent:
  -> Review Request
  -> Resolve Request

Team Lead -> "Escalate Request"
"Escalate Request" ..> "Review Request" : extend`

export const ucdExamples: UCDExample[] = [
  {
    id: 'product-discovery',
    name: 'Product discovery',
    description:
      'Actors, a system boundary, associations, and an include relationship.',
    source: productDiscoveryExample,
  },
  {
    id: 'online-store',
    name: 'Online store',
    description: 'Actor generalisation with include and extend relationships.',
    source: onlineStoreExample,
  },
  {
    id: 'service-desk',
    name: 'Service desk',
    description:
      'A support workflow with specialised actors and escalation behaviour.',
    source: serviceDeskExample,
  },
]
