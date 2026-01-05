import { User } from './User';
import { Repository } from './Repository';
import { ScanJob } from './ScanJob';
import { Signal } from './Signal';
import { IssueCandidate } from './IssueCandidate';
import { LLMUsage } from './LLMUsage';
import { AuditLog } from './AuditLog';

// Associations
Repository.hasMany(ScanJob, { foreignKey: 'repository_id' });
ScanJob.belongsTo(Repository, { foreignKey: 'repository_id' });

Repository.hasMany(Signal, { foreignKey: 'repository_id' });
Signal.belongsTo(Repository, { foreignKey: 'repository_id' });

Repository.hasMany(IssueCandidate, { foreignKey: 'repository_id' });
IssueCandidate.belongsTo(Repository, { foreignKey: 'repository_id' });

Repository.hasMany(LLMUsage, { foreignKey: 'repository_id' });
LLMUsage.belongsTo(Repository, { foreignKey: 'repository_id' });

Signal.hasOne(IssueCandidate, { foreignKey: 'signal_id' });
IssueCandidate.belongsTo(Signal, { foreignKey: 'signal_id' });

User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

export { User, Repository, ScanJob, Signal, IssueCandidate, LLMUsage, AuditLog };
