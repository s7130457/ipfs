module.exports = {
  permission: {
    admin: { 
      users: {
        "create:any": ['*'],
        "read:any": ['*'],
        "update:any": ['*'],
        "delete:any": ['*']
      },
      logs: { 
        "create:any": ['*'],
        "read:any": ['*'],
        "update:any": ['*'],
        "delete:any": ['*'] 
      },
      system: { 
        "create:any": ['*'],
        "read:any": ['*'],
        "update:any": ['*'],
        "delete:any": ['*'] 
      },
    },
    user: {
      users: {
        "read:own": ['*'],
        "update:own": ['*']
      },
      logs: { "read:any": ['*'] },
      system: { "read:any": ['*'] },
    }
  }
}